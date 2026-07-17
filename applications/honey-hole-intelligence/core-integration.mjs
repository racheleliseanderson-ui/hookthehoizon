const CORE_PIN = '83e2d80efa8125aed986be5317b3b43a06884bbc';
const ALLOWED_EVENTS = new Set([
  'official_regulation_opened',
  'trip_safety_check_complete',
  'conservation_controls_acknowledged',
  'public_safe_location_used'
]);
const PROHIBITED_KEYS = new Set(['exactLocation','coordinates','privateAccess','speciesLocation','notes','email','phone']);

export function createTripReadinessEnvelope(domainResult, { resultId, generatedAt = new Date().toISOString() } = {}) {
  if (!domainResult || domainResult.applicationId !== 'HHI-001') throw new Error('A Honey Hole Intelligence domain result is required.');
  const unknowns = [...new Set([
    ...(domainResult.unknownFields || []),
    ...(domainResult.staleFields || []).map((key) => `stale:${key}`),
    ...(domainResult.contradictionFields || []).map((key) => `contradicted:${key}`),
    ...(domainResult.missingOfficialSourceFields || []).map((key) => `missing-source:${key}`)
  ])];
  return {
    schemaVersion: '0.2.0',
    id: resultId || `hhi-${generatedAt}`,
    generatedAt,
    application: { id: 'HHI-001', version: '0.1.0', adapterKey: 'honey-hole', adapterVersion: '0.1.0' },
    core: { version: '0.2.0', commitPin: CORE_PIN, floatingMainAllowed: false },
    answer: { code: domainResult.decisionState || domainResult.status, summary: domainResult.boundary || domainResult.message || 'Trip-readiness result.' },
    domainResult,
    evidenceAssessment: {
      evidenceCount: Array.isArray(domainResult.evidence) ? domainResult.evidence.length : 0,
      unknownCount: (domainResult.unknownFields || []).length,
      staleCount: (domainResult.staleFields || []).length,
      contradictionCount: (domainResult.contradictionFields || []).length,
      hardStopCount: (domainResult.hardStops || []).length
    },
    unknowns,
    limitations: [domainResult.boundary].filter(Boolean),
    privacy: {
      class: 'high',
      requiresConsent: false,
      allowedPersistence: 'local',
      minimizationRule: 'Retain only broad public-region context; never persist exact or inference-enabling location details in analytics or logs.',
      prohibitedSurfaces: ['analytics', 'logs']
    },
    provenance: (domainResult.evidence || []).map((item) => ({
      fieldKey: item.key,
      status: item.status || 'unverified',
      verifiedAt: item.verifiedAt || null,
      sourcePresent: Boolean(item.sourceUrl),
      stale: Boolean(item.stale)
    }))
  };
}

export function createTripReadinessAnalyticsEvent(name, payload = {}) {
  if (!ALLOWED_EVENTS.has(name)) throw new Error(`Unsupported Honey Hole Intelligence event: ${name}`);
  for (const key of Object.keys(payload)) if (PROHIBITED_KEYS.has(key)) throw new Error(`Prohibited analytics field: ${key}`);
  return { schemaVersion: '0.2.0', applicationId: 'HHI-001', name, payload: structuredClone(payload) };
}
