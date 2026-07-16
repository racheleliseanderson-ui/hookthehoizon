import {
  freshnessPenalty,
  rejectLocationSensitiveInput,
  resolveSourceState,
  sanitizePublicPayload
} from '../_shared/governance.mjs';

const COMPATIBILITY_ORDER = { compatible: 4, conditional: 3, unknown: 2, insufficient_information: 1, mismatch: 0 };
const EVIDENCE_PENALTY = {
  primary_documentation: 0,
  official_data: 0,
  reviewed_secondary: 4,
  contributor_observation: 7,
  user_observation: 10,
  inferred: 16,
  disputed: 28,
  unknown: 24,
  do_not_publish: 100
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSet(values = []) {
  return new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function confidenceBand(score, compatibility, sourceState) {
  if (compatibility === 'mismatch' || sourceState === 'unavailable') return 'insufficient';
  if (score >= 80 && compatibility === 'compatible' && sourceState === 'fresh') return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 35) return 'low';
  return 'insufficient';
}

function matchScore(value, supported = [], weight) {
  if (!value || !Array.isArray(supported) || !supported.length) return 0;
  return normalizedSet(supported).has(String(value).toLowerCase()) ? weight : -Math.ceil(weight / 2);
}

function setOverlapScore(actual, supported, each, max) {
  const actualSet = normalizedSet(actual);
  const supportedSet = normalizedSet(supported);
  let matches = 0;
  for (const item of actualSet) if (supportedSet.has(item)) matches += 1;
  return Math.min(max, matches * each);
}

function outcomeAdjustment(summary = {}) {
  const exposures = Number(summary.exposures) || 0;
  const positive = Number(summary.positive) || 0;
  const negative = Number(summary.negative) || 0;
  if (exposures < 5 || positive + negative === 0) return { adjustment: 0, note: 'insufficient outcome exposure' };
  const observed = (positive + 1) / (positive + negative + 2);
  const centered = (observed - 0.5) * 12;
  return {
    adjustment: clamp(centered, -6, 6),
    note: 'small exposure-adjusted outcome signal; reporting volume does not determine rank'
  };
}

function compatibilityFor(candidateId, systemCompatibility = {}) {
  const record = systemCompatibility[candidateId];
  if (!record || !(record.tier in COMPATIBILITY_ORDER)) return { tier: 'unknown', source: null };
  return { tier: record.tier, source: record.applicationId || 'HTH-SC-001' };
}

function differenceCount(a, b) {
  const keys = ['actionFamily', 'colorFamily', 'targetDepth', 'cadence'];
  return keys.reduce((count, key) => count + (a?.presentation?.[key] !== b?.presentation?.[key] ? 1 : 0), 0);
}

function rolePlans(ranked) {
  if (!ranked.length) return [];
  const selected = [];
  const best = { ...ranked[0], role: 'best_supported' };
  selected.push(best);

  const contrast = ranked.slice(1).find((candidate) => differenceCount(best, candidate) >= 2);
  if (contrast) selected.push({ ...contrast, role: 'contrast_experiment' });

  const already = new Set(selected.map((item) => item.id));
  const fallback = ranked.find((candidate) => !already.has(candidate.id) && candidate.failureSignals.length);
  if (fallback) selected.push({ ...fallback, role: 'fallback' });

  return selected.slice(0, 3);
}

export function evaluatePresentationPlanner(input, now = new Date()) {
  const errors = [];
  if (!input?.method) errors.push('method is required');
  if (!input?.waterType) errors.push('waterType is required');
  if (!input?.tripGoal) errors.push('tripGoal is required');
  if (!input?.structureBand) errors.push('structureBand is required');
  if (!input?.depthBand) errors.push('depthBand is required');
  if (!Array.isArray(input?.candidates)) errors.push('candidates must be an array');
  if (!Array.isArray(input?.inventoryIds)) errors.push('inventoryIds must be an array');

  const locationCheck = rejectLocationSensitiveInput(input);
  if (!locationCheck.ok) errors.push('location-sensitive input is prohibited');
  if (errors.length) return { status: 'invalid', errors, privacyFindings: locationCheck.errors || [] };

  const inventory = normalizedSet(input.inventoryIds);
  const conditions = normalizedSet(input.conditions);
  const ranked = [];
  const excluded = [];

  for (const candidate of input.candidates) {
    if (!candidate?.id || !candidate?.label) continue;
    if (!Array.isArray(candidate.sourceIds) || candidate.sourceIds.length === 0) {
      excluded.push({ id: candidate.id, reason: 'missing_source_ledger_reference' });
      continue;
    }
    if (candidate.evidenceState === 'do_not_publish') {
      excluded.push({ id: candidate.id, reason: 'do_not_publish_evidence_state' });
      continue;
    }

    const compatibility = compatibilityFor(candidate.id, input.systemCompatibility);
    if (compatibility.tier === 'mismatch') {
      excluded.push({ id: candidate.id, reason: 'equipment_mismatch' });
      continue;
    }

    const owned = inventory.has(String(candidate.inventoryId || candidate.id).toLowerCase());
    if (input.inventoryOnly !== false && !owned) {
      excluded.push({ id: candidate.id, reason: 'not_in_owned_inventory' });
      continue;
    }

    const sourceState = resolveSourceState(candidate.sourceFreshness || {}, now);
    if (sourceState.state === 'unavailable') {
      excluded.push({ id: candidate.id, reason: 'source_unavailable' });
      continue;
    }

    const outcome = outcomeAdjustment(candidate.outcomeSummary);
    const dimensionScore =
      matchScore(input.method, candidate.supportedMethods, 10) +
      matchScore(input.waterType, candidate.supportedWaterTypes, 8) +
      matchScore(input.tripGoal, candidate.tripGoals, 5) +
      matchScore(input.structureBand, candidate.structureBands, 7) +
      matchScore(input.depthBand, candidate.depthBands, 7) +
      setOverlapScore(conditions, candidate.conditionMatches, 4, 20);

    const compatibilityAdjustment = ({ compatible: 8, conditional: 0, unknown: -9, insufficient_information: -14 })[compatibility.tier] ?? -14;
    const evidenceScore = clamp(Number(candidate.evidenceScore) || 0);
    const evidencePenalty = EVIDENCE_PENALTY[candidate.evidenceState] ?? EVIDENCE_PENALTY.unknown;
    const inventoryAdjustment = owned ? 6 : 0;
    const score = clamp(
      evidenceScore + dimensionScore + compatibilityAdjustment + inventoryAdjustment + outcome.adjustment
      - evidencePenalty - freshnessPenalty(sourceState.state)
    );

    ranked.push({
      id: candidate.id,
      inventoryId: candidate.inventoryId || candidate.id,
      label: candidate.label,
      score,
      confidence: confidenceBand(score, compatibility.tier, sourceState.state),
      compatibility,
      sourceIds: [...candidate.sourceIds],
      evidenceState: candidate.evidenceState || 'unknown',
      sourceFreshness: sourceState,
      owned,
      matchedConditions: [...normalizedSet(candidate.conditionMatches)].filter((condition) => conditions.has(condition)),
      presentation: {
        actionFamily: candidate.actionFamily || 'unknown',
        sizeBand: candidate.sizeBand || 'unknown',
        colorFamily: candidate.colorFamily || 'unknown',
        targetDepth: candidate.targetDepth || 'unknown',
        cadence: candidate.cadence || 'unknown',
        firstAdjustment: candidate.firstAdjustment || 'Change one major variable at a time and record the result.'
      },
      whyItMayFit: candidate.whyItMayFit || [],
      failureSignals: candidate.failureSignals || [],
      noPurchaseAlternative: candidate.noPurchaseAlternative || null,
      outcomeSignal: outcome.note
    });
  }

  ranked.sort((a, b) => {
    const compatibilityDifference = COMPATIBILITY_ORDER[b.compatibility.tier] - COMPATIBILITY_ORDER[a.compatibility.tier];
    return compatibilityDifference || b.score - a.score || a.label.localeCompare(b.label);
  });

  const plans = rolePlans(ranked);
  const result = {
    status: 'evaluated',
    applicationId: 'HTH-PP-001',
    contractVersion: '1.0.0',
    ruleVersion: '0.2.0-preview',
    evaluatedAt: now.toISOString(),
    locationData: 'not_collected',
    interpretation: 'Presentation experiments, not a catch, activity, safety, access, or legal-use guarantee.',
    plans,
    excluded,
    unknowns: [
      ...(plans.length ? [] : ['no owned, non-mismatched, sourced candidates remain']),
      ...(conditions.size ? [] : ['condition bands not supplied'])
    ],
    experimentRule: 'Change one major presentation variable at a time so the outcome remains interpretable.',
    fieldExperiment: plans[0] ? {
      hypothesis: `${plans[0].label} is the best-supported starting presentation for the declared conditions.`,
      variableChanged: plans[0].presentation.firstAdjustment,
      heldConstant: ['equipment', 'general location band', 'test duration', 'other presentation variables'],
      result: 'not_tested'
    } : null,
    noPurchaseFirst: true
  };

  const publicPayload = sanitizePublicPayload(result);
  return { ...publicPayload.sanitized, privacyFindings: publicPayload.findings };
}
