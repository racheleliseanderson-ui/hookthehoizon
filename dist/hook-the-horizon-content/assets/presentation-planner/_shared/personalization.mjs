import { rejectSensitiveLocation, sanitizePublicPayload } from './privacy.mjs';

const COMPATIBILITY_ORDER = { compatible: 4, conditional: 3, unknown: 2, insufficient_information: 1, mismatch: 0 };
const SOURCE_PENALTY = { fresh: 0, aging: 7, stale: 20, unknown: 14, outage: 28, unavailable: 100, migrating: 18 };
const EVIDENCE_PENALTY = {
  primary_documentation: 0,
  official_data: 0,
  reviewed_secondary: 4,
  contributor_observation: 7,
  user_observation: 9,
  inferred: 15,
  disputed: 28,
  unknown: 22
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSet(values = []) {
  return new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function matches(value, supported = [], weight = 0) {
  if (!value || !Array.isArray(supported) || !supported.length) return { score: 0, matched: false };
  const matched = normalizedSet(supported).has(String(value).toLowerCase());
  return { score: matched ? weight : -Math.ceil(weight / 2), matched };
}

function overlaps(actual = [], supported = [], each = 3, max = 15) {
  const actualSet = normalizedSet(actual);
  const supportedSet = normalizedSet(supported);
  const matched = [...actualSet].filter((value) => supportedSet.has(value));
  return { score: Math.min(max, matched.length * each), matched };
}

function historySignal(candidateId, outcomes = []) {
  const relevant = outcomes.filter((item) => item.candidateId === candidateId && ['positive', 'negative', 'inconclusive'].includes(item.result));
  if (relevant.length < 3) return { adjustment: 0, label: 'insufficient_personal_history', exposures: relevant.length };
  const weighted = relevant.reduce((total, item) => {
    const exposure = Math.max(1, Number(item.exposure) || 1);
    if (item.result === 'positive') return total + exposure;
    if (item.result === 'negative') return total - exposure;
    return total;
  }, 0);
  const totalExposure = relevant.reduce((total, item) => total + Math.max(1, Number(item.exposure) || 1), 0);
  const normalized = totalExposure ? weighted / totalExposure : 0;
  return {
    adjustment: clamp(normalized * 8, -6, 6),
    label: 'bounded_personal_history',
    exposures: totalExposure
  };
}

function confidenceBand(score, compatibility, sourceState) {
  if (compatibility === 'mismatch' || sourceState === 'unavailable') return 'insufficient';
  if (score >= 80 && compatibility === 'compatible' && sourceState === 'fresh') return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 35) return 'low';
  return 'insufficient';
}

function differences(a, b) {
  const keys = ['actionFamily', 'colorFamily', 'targetDepth', 'cadence'];
  return keys.reduce((count, key) => count + (a?.presentation?.[key] !== b?.presentation?.[key] ? 1 : 0), 0);
}

function assignRoles(ranked) {
  if (!ranked.length) return [];
  const output = [{ ...ranked[0], role: 'best_supported' }];
  const contrast = ranked.slice(1).find((item) => differences(ranked[0], item) >= 2);
  if (contrast) output.push({ ...contrast, role: 'contrast_experiment' });
  const used = new Set(output.map((item) => item.id));
  const fallback = ranked.find((item) => !used.has(item.id) && item.failureSignals?.length);
  if (fallback) output.push({ ...fallback, role: 'fallback' });
  return output.slice(0, 3);
}

export function generatePersonalizedPlan({ profile, inventory, conditions, candidates, outcomes = [], now = new Date() }) {
  const errors = [];
  const privacyCheck = rejectSensitiveLocation({ profile, inventory, conditions, outcomes });
  if (!privacyCheck.ok) errors.push('location-sensitive data is not accepted by Smart Mode');
  if (!profile?.profileId) errors.push('profile.profileId is required');
  if (!Array.isArray(inventory)) errors.push('inventory must be an array');
  if (!Array.isArray(candidates)) errors.push('candidates must be an array');
  if (!conditions?.method || !conditions?.waterType || !conditions?.tripGoal) {
    errors.push('method, waterType, and tripGoal are required');
  }
  if (errors.length) return { status: 'invalid', errors, privacyFindings: privacyCheck.findings };

  const owned = new Set(inventory.map((item) => String(item.itemId).toLowerCase()));
  const preferredSpecies = normalizedSet(profile.preferredSpecies);
  const preferredMethods = normalizedSet(profile.preferredMethods);
  const profileGoals = normalizedSet(profile.tripGoals);
  const ranked = [];
  const excluded = [];

  for (const candidate of candidates) {
    if (!candidate?.id || !candidate?.label) continue;
    if (!Array.isArray(candidate.sourceIds) || candidate.sourceIds.length === 0) {
      excluded.push({ id: candidate.id, reason: 'missing_source_reference' });
      continue;
    }
    if (candidate.compatibility === 'mismatch') {
      excluded.push({ id: candidate.id, reason: 'equipment_mismatch' });
      continue;
    }
    const inventoryId = String(candidate.inventoryId || candidate.id).toLowerCase();
    if (!owned.has(inventoryId)) {
      excluded.push({ id: candidate.id, reason: 'not_in_owned_inventory' });
      continue;
    }
    if (candidate.sourceState === 'unavailable') {
      excluded.push({ id: candidate.id, reason: 'source_unavailable' });
      continue;
    }

    const factors = [];
    const method = matches(conditions.method, candidate.supportedMethods, 10);
    factors.push({ factor: 'method', adjustment: method.score, matched: method.matched });
    const water = matches(conditions.waterType, candidate.supportedWaterTypes, 8);
    factors.push({ factor: 'water_type', adjustment: water.score, matched: water.matched });
    const goal = matches(conditions.tripGoal, candidate.tripGoals, 7);
    factors.push({ factor: 'trip_goal', adjustment: goal.score, matched: goal.matched });
    const structure = matches(conditions.structureBand, candidate.structureBands, 7);
    factors.push({ factor: 'structure', adjustment: structure.score, matched: structure.matched });
    const depth = matches(conditions.depthBand, candidate.depthBands, 7);
    factors.push({ factor: 'depth', adjustment: depth.score, matched: depth.matched });
    const conditionMatch = overlaps(conditions.conditionBands, candidate.conditionMatches, 4, 20);
    factors.push({ factor: 'conditions', adjustment: conditionMatch.score, matched: conditionMatch.matched });

    const speciesMatch = [...preferredSpecies].some((species) => normalizedSet(candidate.supportedSpecies).has(species));
    const profileMethodMatch = [...preferredMethods].some((methodValue) => normalizedSet(candidate.supportedMethods).has(methodValue));
    const profileGoalMatch = [...profileGoals].some((goalValue) => normalizedSet(candidate.tripGoals).has(goalValue));
    const profileAdjustment = (speciesMatch ? 4 : 0) + (profileMethodMatch ? 3 : 0) + (profileGoalMatch ? 3 : 0);
    factors.push({ factor: 'profile_preferences', adjustment: profileAdjustment, matched: { speciesMatch, profileMethodMatch, profileGoalMatch } });

    const compatibilityAdjustment = ({ compatible: 8, conditional: 0, unknown: -8, insufficient_information: -14 })[candidate.compatibility] ?? -14;
    factors.push({ factor: 'system_compatibility', adjustment: compatibilityAdjustment, matched: candidate.compatibility });

    const history = historySignal(candidate.id, outcomes);
    factors.push({ factor: 'personal_history', adjustment: history.adjustment, matched: history.label, exposures: history.exposures });

    const evidenceScore = clamp(Number(candidate.evidenceScore) || 0);
    const sourcePenalty = SOURCE_PENALTY[candidate.sourceState] ?? SOURCE_PENALTY.unknown;
    const evidencePenalty = EVIDENCE_PENALTY[candidate.evidenceState] ?? EVIDENCE_PENALTY.unknown;
    const factorTotal = factors.reduce((total, factor) => total + Number(factor.adjustment || 0), 0);
    const score = clamp(evidenceScore + factorTotal - sourcePenalty - evidencePenalty);

    ranked.push({
      id: candidate.id,
      inventoryId: candidate.inventoryId || candidate.id,
      label: candidate.label,
      score,
      confidence: confidenceBand(score, candidate.compatibility, candidate.sourceState),
      compatibility: candidate.compatibility,
      evidenceState: candidate.evidenceState || 'unknown',
      sourceState: candidate.sourceState || 'unknown',
      sourceIds: [...candidate.sourceIds],
      factors,
      presentation: {
        actionFamily: candidate.actionFamily || 'unknown',
        sizeBand: candidate.sizeBand || 'unknown',
        colorFamily: candidate.colorFamily || 'unknown',
        targetDepth: candidate.targetDepth || 'unknown',
        cadence: candidate.cadence || 'unknown',
        firstAdjustment: candidate.firstAdjustment || 'Change one major variable at a time.'
      },
      whyItMayFit: candidate.whyItMayFit || [],
      failureSignals: candidate.failureSignals || [],
      noPurchaseAlternative: candidate.noPurchaseAlternative || null
    });
  }

  ranked.sort((a, b) => {
    const compatibilityDifference = COMPATIBILITY_ORDER[b.compatibility] - COMPATIBILITY_ORDER[a.compatibility];
    return compatibilityDifference || b.score - a.score || a.label.localeCompare(b.label);
  });

  const plans = assignRoles(ranked);
  const result = {
    status: 'evaluated',
    applicationId: 'HTH-SM-001',
    ruleVersion: '1.0.0',
    evaluatedAt: now.toISOString(),
    locationData: 'not_collected',
    interpretation: 'Explainable presentation guidance from declared conditions, owned inventory, reviewed evidence, compatibility, and bounded personal history. It is not a bite forecast or catch guarantee.',
    plans,
    excluded,
    unknowns: [
      ...(plans.length ? [] : ['no owned, sourced, non-mismatched candidates remain']),
      ...(outcomes.length ? [] : ['no personal outcome history yet'])
    ],
    nextAction: plans[0]?.presentation?.firstAdjustment || null,
    noPurchaseFirst: true
  };

  const publicResult = sanitizePublicPayload(result);
  return { ...publicResult.sanitized, privacyFindings: publicResult.findings };
}

export function summarizeMastery(outcomes = []) {
  const tested = outcomes.filter((item) => ['positive', 'negative', 'inconclusive'].includes(item.result));
  const positive = tested.filter((item) => item.result === 'positive').length;
  const negative = tested.filter((item) => item.result === 'negative').length;
  const inconclusive = tested.filter((item) => item.result === 'inconclusive').length;
  const variables = new Set(tested.map((item) => item.changedVariable).filter(Boolean));
  return {
    experiments: tested.length,
    positive,
    negative,
    inconclusive,
    variablesTested: variables.size,
    nextMilestone: tested.length < 3 ? 'complete_three_controlled_tests' : tested.length < 10 ? 'complete_ten_controlled_tests' : 'compare_seasonal_patterns'
  };
}
