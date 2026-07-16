import {
  freshnessPenalty,
  rejectLocationSensitiveInput,
  resolveSourceState,
  sanitizePublicPayload
} from '../_shared/governance.mjs';

const REVIEW_STATES = new Set(['approved_preview', 'approved_public', 'test_fixture_only']);
const EVIDENCE_PENALTY = {
  official_data: 0,
  primary_documentation: 0,
  reviewed_secondary: 5,
  contributor_observation: 8,
  user_observation: 10,
  inferred: 18,
  disputed: 30,
  unknown: 24,
  do_not_publish: 100
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSet(values = []) {
  return new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function confidenceBand(score, sourceState, reviewState) {
  if (!REVIEW_STATES.has(reviewState) || sourceState === 'unavailable') return 'insufficient';
  if (score >= 80 && sourceState === 'fresh') return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 35) return 'low';
  return 'insufficient';
}

function bandMatch(value, supported = [], weight = 8) {
  if (!value || !Array.isArray(supported) || !supported.length) return 0;
  return normalizedSet(supported).has(String(value).toLowerCase()) ? weight : -Math.ceil(weight / 2);
}

function temperatureScore(value, range) {
  if (!Number.isFinite(value) || !range || !Number.isFinite(range.minC) || !Number.isFinite(range.maxC)) return 0;
  if (value >= range.minC && value <= range.maxC) return 10;
  const distance = value < range.minC ? range.minC - value : value - range.maxC;
  return distance <= 2 ? -4 : -10;
}

function inventoryCoverage(requiredMaterials = [], inventory) {
  const matched = [];
  const missing = [];
  for (const requirement of requiredMaterials) {
    const id = String(requirement.materialId || requirement).toLowerCase();
    if (!id) continue;
    if (inventory.has(id)) matched.push(id);
    else missing.push(id);
  }
  if (!matched.length && !missing.length) return { state: 'not_required', matched, missing };
  const ratio = matched.length / (matched.length + missing.length);
  const state = ratio === 1 ? 'tie_now' : ratio >= 0.75 ? 'almost' : 'unavailable';
  return { state, matched, missing };
}

export function evaluateHatchMatch(input, now = new Date()) {
  const errors = [];
  if (!input?.regionBand) errors.push('regionBand is required');
  if (!input?.dateBand) errors.push('dateBand is required');
  if (!input?.waterType) errors.push('waterType is required');
  if (!Array.isArray(input?.candidates)) errors.push('candidates must be an array');

  const locationCheck = rejectLocationSensitiveInput(input);
  if (!locationCheck.ok) errors.push('location-sensitive input is prohibited');
  if (errors.length) return { status: 'invalid', errors, privacyFindings: locationCheck.errors || [] };

  const observations = normalizedSet(input.observations);
  const negativeObservations = normalizedSet(input.negativeObservations);
  const inventory = normalizedSet((input.inventory || []).map((item) => item.materialId || item));
  const ranked = [];
  const excluded = [];

  for (const candidate of input.candidates) {
    if (!candidate?.id || !candidate?.label) continue;
    if (!REVIEW_STATES.has(candidate.reviewState)) {
      excluded.push({ id: candidate.id, reason: 'biological_review_not_complete' });
      continue;
    }
    if (!Array.isArray(candidate.sourceIds) || candidate.sourceIds.length === 0) {
      excluded.push({ id: candidate.id, reason: 'missing_source_ledger_reference' });
      continue;
    }
    if (candidate.evidenceState === 'do_not_publish') {
      excluded.push({ id: candidate.id, reason: 'do_not_publish_evidence_state' });
      continue;
    }

    const sourceState = resolveSourceState(candidate.sourceFreshness || {}, now);
    if (sourceState.state === 'unavailable') {
      excluded.push({ id: candidate.id, reason: 'source_unavailable' });
      continue;
    }

    const observationTerms = normalizedSet(candidate.observationMatches);
    const disconfirmingTerms = normalizedSet(candidate.disconfirmingObservations);
    const matchedObservations = [...observationTerms].filter((term) => observations.has(term));
    const matchedNegative = [...disconfirmingTerms].filter((term) => observations.has(term) || negativeObservations.has(term));
    const missingConfirmation = [...observationTerms].filter((term) => !observations.has(term));

    const contextScore =
      bandMatch(input.regionBand, candidate.regionBands, 9) +
      bandMatch(input.dateBand, candidate.dateBands, 8) +
      bandMatch(input.waterType, candidate.waterTypes, 8) +
      temperatureScore(input.waterTempC, candidate.temperatureRangeC);
    const observationScore = Math.min(28, matchedObservations.length * 9) - Math.min(30, matchedNegative.length * 15);
    const evidenceScore = clamp(Number(candidate.evidenceScore) || 0);
    const evidencePenalty = EVIDENCE_PENALTY[candidate.evidenceState] ?? EVIDENCE_PENALTY.unknown;
    const score = clamp(evidenceScore + contextScore + observationScore - evidencePenalty - freshnessPenalty(sourceState.state));

    const patterns = Array.isArray(candidate.patterns)
      ? candidate.patterns.map((pattern) => ({
          id: pattern.id,
          label: pattern.label,
          sourceIds: pattern.sourceIds || candidate.sourceIds,
          coverage: inventoryCoverage(pattern.requiredMaterials, inventory),
          historyState: pattern.historyState || 'unknown',
          fieldEvidenceState: pattern.fieldEvidenceState || 'unknown',
          limitations: pattern.limitations || []
        }))
      : [];

    patterns.sort((a, b) => {
      const order = { tie_now: 4, almost: 3, unavailable: 2, not_required: 1 };
      return order[b.coverage.state] - order[a.coverage.state] || a.label.localeCompare(b.label);
    });

    ranked.push({
      id: candidate.id,
      label: candidate.label,
      reviewState: candidate.reviewState,
      sourceIds: [...candidate.sourceIds],
      evidenceState: candidate.evidenceState || 'unknown',
      sourceFreshness: sourceState,
      score,
      confidence: confidenceBand(score, sourceState.state, candidate.reviewState),
      matchedObservations,
      matchedNegative,
      missingConfirmation,
      confirmationCues: candidate.confirmationCues || [],
      disconfirmationCues: candidate.disconfirmationCues || [],
      whyItMayFit: candidate.whyItMayFit || [],
      whyItMayFail: candidate.whyItMayFail || [],
      patterns
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  const result = {
    status: 'evaluated',
    applicationId: 'HTH-HM-001',
    contractVersion: '1.0.0',
    ruleVersion: '0.2.0-preview',
    evaluatedAt: now.toISOString(),
    locationData: 'not_collected',
    interpretation: 'Plausibility ranking only. This result does not verify that a hatch is occurring or establish a universal pattern recommendation.',
    rankedCandidates: ranked.slice(0, 5),
    excluded,
    unknowns: [
      ...(observations.size ? [] : ['no direct forage or insect observations supplied']),
      ...(Number.isFinite(input.waterTempC) ? [] : ['water temperature unknown']),
      ...(inventory.size ? [] : ['tying inventory not supplied']),
      ...(ranked.length ? [] : ['no reviewed, sourced biological candidates remain'])
    ],
    nextEvidence: [
      'Record visible body, wing, tail, movement, rise-form, and water-column cues.',
      'Record disconfirming observations and non-observations, not only matches.',
      'Confirm source freshness and regional applicability before public use.',
      'Log successful, unsuccessful, and inconclusive field tests without exact location.'
    ]
  };

  const publicPayload = sanitizePublicPayload(result);
  return { ...publicPayload.sanitized, privacyFindings: publicPayload.findings };
}
