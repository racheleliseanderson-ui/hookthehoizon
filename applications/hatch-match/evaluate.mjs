const FRESHNESS_PENALTY = {
  current: 0,
  aging: 8,
  stale: 20,
  unknown: 12
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSet(values = []) {
  return new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function confidenceBand(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 35) return 'low';
  return 'insufficient';
}

function inventoryCoverage(requiredMaterials = [], inventory) {
  const required = normalizedSet(requiredMaterials);
  if (!required.size) return { state: 'not_required', matched: [], missing: [] };

  const matched = [];
  const missing = [];
  for (const material of required) {
    if (inventory.has(material)) matched.push(material);
    else missing.push(material);
  }

  const ratio = matched.length / required.size;
  const state = ratio === 1 ? 'tie_now' : ratio >= 0.75 ? 'almost' : 'unavailable';
  return { state, matched, missing };
}

export function evaluateHatchMatch(input) {
  const errors = [];
  if (!input?.regionBand) errors.push('regionBand is required');
  if (!input?.dateBand) errors.push('dateBand is required');
  if (!input?.waterType) errors.push('waterType is required');
  if (!Array.isArray(input?.candidates)) errors.push('candidates must be an array');
  if (input?.exactLocation || input?.coordinates || input?.latitude || input?.longitude) {
    errors.push('exact location data is prohibited');
  }
  if (errors.length) return { status: 'invalid', errors };

  const observations = normalizedSet(input.observations);
  const inventory = normalizedSet(input.inventory);
  const ranked = [];

  for (const candidate of input.candidates) {
    if (!candidate?.id || !candidate?.label) continue;

    const baseEvidence = clamp(Number(candidate.evidenceScore) || 0, 0, 100);
    const observationTerms = normalizedSet(candidate.observationMatches);
    const matchedObservations = [...observationTerms].filter((term) => observations.has(term));
    const observationBoost = Math.min(24, matchedObservations.length * 8);
    const freshness = candidate.sourceFreshness || 'unknown';
    const freshnessPenalty = FRESHNESS_PENALTY[freshness] ?? FRESHNESS_PENALTY.unknown;
    const score = clamp(baseEvidence + observationBoost - freshnessPenalty, 0, 100);

    const patterns = Array.isArray(candidate.patterns)
      ? candidate.patterns.map((pattern) => ({
          id: pattern.id,
          label: pattern.label,
          coverage: inventoryCoverage(pattern.requiredMaterials, inventory),
          evidenceScore: clamp(Number(pattern.evidenceScore) || 0, 0, 100)
        }))
      : [];

    patterns.sort((a, b) => {
      const stateOrder = { tie_now: 3, almost: 2, unavailable: 1, not_required: 0 };
      const stateDifference = stateOrder[b.coverage.state] - stateOrder[a.coverage.state];
      return stateDifference || b.evidenceScore - a.evidenceScore;
    });

    ranked.push({
      id: candidate.id,
      label: candidate.label,
      score,
      confidence: confidenceBand(score),
      sourceFreshness: freshness,
      matchedObservations,
      confirmationCues: candidate.confirmationCues || [],
      whyItMayFit: candidate.whyItMayFit || [],
      whyItMayFail: candidate.whyItMayFail || [],
      patterns
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  const unknowns = [];
  if (!observations.size) unknowns.push('no direct forage or insect observations supplied');
  if (!Number.isFinite(input.waterTempC)) unknowns.push('water temperature unknown');
  if (!inventory.size) unknowns.push('tying inventory not supplied');
  if (!ranked.length) unknowns.push('no evidence-backed candidates supplied');

  return {
    status: 'evaluated',
    applicationId: 'HTH-HM-001',
    locationData: 'not_collected',
    interpretation: 'Plausibility ranking only; this result does not verify that a hatch is occurring.',
    rankedCandidates: ranked.slice(0, 5),
    unknowns,
    nextEvidence: [
      'Record visible insect or forage traits and behavior.',
      'Confirm water temperature and source freshness when safely available.',
      'Log both successful and unsuccessful field tests without exposing protected locations.'
    ]
  };
}
