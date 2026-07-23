const DAY_MS = 86_400_000;

export const OFFICIAL_SOURCE_POLICY = Object.freeze({
  closure: { maxAgeDays: 1, critical: true, ownerRequired: true },
  hazard: { maxAgeDays: 1, critical: true, ownerRequired: true },
  weather: { maxAgeDays: 1, critical: false, ownerRequired: true },
  waterCondition: { maxAgeDays: 1, critical: false, ownerRequired: true },
  regulation: { maxAgeDays: 7, critical: true, ownerRequired: true },
  permit: { maxAgeDays: 7, critical: false, ownerRequired: true },
  access: { maxAgeDays: 30, critical: true, ownerRequired: true },
  ownership: { maxAgeDays: 30, critical: false, ownerRequired: true },
  conservation: { maxAgeDays: 90, critical: true, ownerRequired: true }
});

function parseDate(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sourceUrl(fact) {
  return fact?.currentCheckUrl || fact?.sourceUrl || null;
}

function reviewedAt(fact) {
  return fact?.reviewedAt || fact?.verifiedAt || null;
}

export function assessOfficialFact(key, fact, now = new Date(), policy = OFFICIAL_SOURCE_POLICY) {
  const rule = policy[key] || { maxAgeDays: 30, critical: false, ownerRequired: true };
  const notApplicable = fact?.status === 'not_applicable';
  const reviewed = reviewedAt(fact);
  const reviewedTimestamp = parseDate(reviewed);
  const nextReviewTimestamp = parseDate(fact?.nextReviewAt);
  const nowTimestamp = now.getTime();
  const missing = !notApplicable && (!fact || fact.value === null || fact.value === undefined || ['unknown', 'unverified'].includes(fact.status));
  const unavailable = !notApplicable && (fact?.status === 'source_unavailable' || fact?.status === 'unavailable');
  const conflicting = !notApplicable && (fact?.status === 'contradicted' || fact?.status === 'conflicting');
  const missingOwner = !notApplicable && rule.ownerRequired && !String(fact?.sourceOwner || '').trim();
  const missingCurrentCheck = !notApplicable && !sourceUrl(fact);
  const missingReviewDate = !notApplicable && !reviewedTimestamp;
  const explicitStale = !notApplicable && ['official_stale', 'stale', 'expired'].includes(fact?.status);
  const ageExpired = !notApplicable && reviewedTimestamp !== null && nowTimestamp - reviewedTimestamp > rule.maxAgeDays * DAY_MS;
  const scheduledReviewExpired = !notApplicable && nextReviewTimestamp !== null && nowTimestamp > nextReviewTimestamp;
  const stale = explicitStale || ageExpired || scheduledReviewExpired;
  const unsupported = missingOwner || missingCurrentCheck || missingReviewDate;
  const blocked = Boolean(rule.critical && (missing || unavailable || conflicting || stale || unsupported));
  const confidenceImpact = blocked ? 'blocked' : (missing || unavailable || conflicting || stale || unsupported) ? 'reduced' : 'supported';

  return {
    key,
    critical: Boolean(rule.critical),
    notApplicable,
    value: fact?.value ?? null,
    status: fact?.status || 'unverified',
    sourceOwner: fact?.sourceOwner || null,
    currentCheckUrl: sourceUrl(fact),
    reviewedAt: reviewed,
    nextReviewAt: fact?.nextReviewAt || null,
    maxAgeDays: rule.maxAgeDays,
    missing,
    unavailable,
    conflicting,
    stale,
    unsupported,
    blocked,
    confidenceImpact,
    reasons: [
      ...(missing ? ['missing-value'] : []),
      ...(unavailable ? ['source-unavailable'] : []),
      ...(conflicting ? ['conflicting-source'] : []),
      ...(stale ? ['stale-or-expired'] : []),
      ...(missingOwner ? ['missing-source-owner'] : []),
      ...(missingCurrentCheck ? ['missing-current-check-url'] : []),
      ...(missingReviewDate ? ['missing-reviewed-at'] : [])
    ]
  };
}

export function assessOfficialFacts(facts, now = new Date(), policy = OFFICIAL_SOURCE_POLICY) {
  return Object.keys(policy).map((key) => assessOfficialFact(key, facts?.[key], now, policy));
}

export function summarizeConfidence(assessments) {
  const blocked = assessments.filter((item) => item.blocked).map((item) => item.key);
  const reduced = assessments.filter((item) => item.confidenceImpact === 'reduced').map((item) => item.key);
  const supported = assessments.filter((item) => item.confidenceImpact === 'supported').map((item) => item.key);
  return {
    level: blocked.length ? 'blocked' : reduced.length ? 'reduced' : 'supported',
    blockedFields: blocked,
    reducedFields: reduced,
    supportedFields: supported,
    explanation: blocked.length
      ? 'One or more critical official facts are stale, unavailable, conflicting, missing ownership, or missing a current-check path. The trip result is blocked pending verification.'
      : reduced.length
        ? 'Noncritical or incomplete evidence reduces confidence. Verify the affected facts before relying on the result.'
        : 'All declared official facts meet the source-ownership and review-date contract for this evaluation time.'
  };
}
