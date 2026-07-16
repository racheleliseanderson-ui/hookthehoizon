const FIT_ORDER = {
  compatible: 3,
  conditional: 2,
  unknown: 1,
  mismatch: 0
};

const FRESHNESS_PENALTY = {
  current: 0,
  aging: 6,
  stale: 18,
  unknown: 10
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSet(values = []) {
  return new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function confidenceBand(score, fit) {
  if (fit === 'mismatch') return 'insufficient';
  if (score >= 80 && fit === 'compatible') return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 35) return 'low';
  return 'insufficient';
}

export function evaluatePresentationPlanner(input) {
  const errors = [];
  if (!input?.method) errors.push('method is required');
  if (!input?.waterType) errors.push('waterType is required');
  if (!input?.tripGoal) errors.push('tripGoal is required');
  if (!Array.isArray(input?.candidates)) errors.push('candidates must be an array');
  if (input?.exactLocation || input?.coordinates || input?.latitude || input?.longitude) {
    errors.push('exact location data is prohibited');
  }
  if (errors.length) return { status: 'invalid', errors };

  const conditions = normalizedSet(input.conditions);
  const ranked = [];
  const excluded = [];

  for (const candidate of input.candidates) {
    if (!candidate?.id || !candidate?.label) continue;

    const equipmentFit = candidate.equipmentFit || 'unknown';
    if (!(equipmentFit in FIT_ORDER)) continue;

    if (equipmentFit === 'mismatch') {
      excluded.push({ id: candidate.id, reason: 'equipment_mismatch' });
      continue;
    }

    if (input.inventoryOnly !== false && candidate.owned !== true) {
      excluded.push({ id: candidate.id, reason: 'not_in_owned_inventory' });
      continue;
    }

    const candidateConditions = normalizedSet(candidate.conditionMatches);
    const matchedConditions = [...candidateConditions].filter((condition) => conditions.has(condition));
    const evidenceScore = clamp(Number(candidate.evidenceScore) || 0, 0, 100);
    const conditionBoost = Math.min(30, matchedConditions.length * 6);
    const inventoryBoost = candidate.owned ? 8 : 0;
    const fitAdjustment = equipmentFit === 'compatible' ? 8 : equipmentFit === 'conditional' ? -4 : -10;
    const freshness = candidate.sourceFreshness || 'unknown';
    const freshnessPenalty = FRESHNESS_PENALTY[freshness] ?? FRESHNESS_PENALTY.unknown;
    const score = clamp(evidenceScore + conditionBoost + inventoryBoost + fitAdjustment - freshnessPenalty, 0, 100);

    ranked.push({
      id: candidate.id,
      label: candidate.label,
      score,
      confidence: confidenceBand(score, equipmentFit),
      equipmentFit,
      matchedConditions,
      sourceFreshness: freshness,
      presentation: {
        sizeBand: candidate.sizeBand || 'unknown',
        colorFamily: candidate.colorFamily || 'unknown',
        targetDepth: candidate.targetDepth || 'unknown',
        cadence: candidate.cadence || 'unknown',
        firstAdjustment: candidate.firstAdjustment || 'Change one major variable at a time and record the result.'
      },
      whyItMayFit: candidate.whyItMayFit || [],
      failureSignals: candidate.failureSignals || [],
      noPurchaseAlternative: candidate.noPurchaseAlternative || null
    });
  }

  ranked.sort((a, b) => {
    const fitDifference = FIT_ORDER[b.equipmentFit] - FIT_ORDER[a.equipmentFit];
    return fitDifference || b.score - a.score || a.label.localeCompare(b.label);
  });

  const unknowns = [];
  if (!conditions.size) unknowns.push('condition bands not supplied');
  if (!ranked.length) unknowns.push('no owned, non-mismatched evidence-backed candidates remain');
  if (!input.structureBand) unknowns.push('structure band unknown');
  if (!input.depthBand) unknowns.push('depth band unknown');

  return {
    status: 'evaluated',
    applicationId: 'HTH-PP-001',
    locationData: 'not_collected',
    interpretation: 'Presentation experiments, not a catch or activity guarantee.',
    plans: ranked.slice(0, 3),
    excluded,
    unknowns,
    experimentRule: 'Change one major presentation variable at a time so the outcome remains interpretable.',
    noPurchaseFirst: true
  };
}
