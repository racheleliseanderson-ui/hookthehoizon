import { rejectSensitiveLocation, sanitizePublicPayload } from './privacy.mjs';
import { assessOfficialFacts, summarizeConfidence } from './freshness.mjs';

export function evaluateHoneyHole(input, now = new Date()) {
  const errors = [];
  if (!input?.publicRegion) errors.push('publicRegion is required');
  if (!input?.tripType) errors.push('tripType is required');
  if (!input?.facts || typeof input.facts !== 'object') errors.push('facts are required');
  if (errors.length) return { status: 'invalid', errors };

  const locationCheck = rejectSensitiveLocation({ publicRegion: input.publicRegion, notes: input.notes || null, facts: input.facts });
  if (!locationCheck.ok) return { status: 'sensitive_location_rejected', applicationId: 'HHI-001', findings: locationCheck.findings, message: 'Exact coordinates, private-access instructions, vulnerable-water identifiers, contributor-sensitive information, and other inference-enabling location data are not accepted. Use a broad public region and current official sources.' };

  const evidence = assessOfficialFacts(input.facts, now);
  const confidence = summarizeConfidence(evidence);
  const unknownFields = evidence.filter((item) => item.missing).map((item) => item.key);
  const staleFields = evidence.filter((item) => item.stale).map((item) => item.key);
  const unavailableFields = evidence.filter((item) => item.unavailable).map((item) => item.key);
  const contradictionFields = evidence.filter((item) => item.conflicting).map((item) => item.key);
  const unsupportedFields = evidence.filter((item) => item.unsupported).map((item) => item.key);
  const criticalUnknowns = evidence.filter((item) => item.blocked).map((item) => item.key);
  const hardStops = [];
  if (input.facts.closure?.value === 'closed') hardStops.push('An official closure is recorded.');
  if (input.facts.access?.value === 'not_permitted') hardStops.push('Legal access is not supported.');
  if (input.facts.hazard?.value === 'severe') hardStops.push('A severe hazard is recorded.');
  if (input.facts.conservation?.value === 'avoid_pressure') hardStops.push('Current conservation controls indicate avoiding additional pressure.');
  if (contradictionFields.some((key) => ['closure', 'access', 'regulation'].includes(key))) hardStops.push('A material official-source contradiction affects legality or access.');

  let decisionState = 'ready_with_controls';
  if (hardStops.length) decisionState = 'do_not_proceed';
  else if (confidence.level === 'blocked') decisionState = 'verify_before_trip';
  else if (confidence.level === 'reduced') decisionState = 'ready_with_reduced_confidence';
  else if (!input.gearReady || !input.backupPlanReady) decisionState = 'preparation_incomplete';

  const officialQuestions = unique([
    ...(needsCheck('regulation', evidence) ? ['What regulations and seasonal restrictions apply today?'] : []),
    ...(needsCheck('closure', evidence) ? ['Are there active closures, emergency orders, or temporary restrictions?'] : []),
    ...(needsCheck('access', evidence) ? ['Is the intended broad public access route legal and currently open?'] : []),
    ...(needsCheck('hazard', evidence) || needsCheck('weather', evidence) || needsCheck('waterCondition', evidence) ? ['What current weather, water, fire, road, and field hazards apply?'] : []),
    ...(needsCheck('conservation', evidence) ? ['What conservation, species, handling, or pressure-reduction controls apply?'] : []),
    ...evidence.filter((item) => item.unsupported).map((item) => `Who owns the current ${humanize(item.key)} source, when was it reviewed, and where is the current official check?`)
  ]);

  const sanitized = sanitizePublicPayload({
    applicationId: 'HHI-001', schemaVersion: '0.2.0', publicRegion: input.publicRegion, tripType: input.tripType, decisionState,
    resultBlocked: decisionState === 'do_not_proceed' || decisionState === 'verify_before_trip', confidence, hardStops,
    criticalUnknowns, unknownFields, staleFields, unavailableFields, contradictionFields, unsupportedFields, officialQuestions,
    readiness: { gearReady: Boolean(input.gearReady), backupPlanReady: Boolean(input.backupPlanReady) },
    backupPlan: input.backupPlanReady ? 'Use the prepared public-safe alternative if any closure, hazard, access, weather, water, regulation, or conservation condition changes.' : 'Create a public-safe alternative that does not depend on the same access, conditions, or resource pressure.',
    boundary: 'This is public-region trip preparation, not a guarantee of legality, access, conditions, safety, or catch. Verify critical facts with the current official authority before departure.',
    evidence
  });
  return { status: sanitized.ok ? 'trip_readiness' : 'trip_readiness_redacted', ...sanitized.sanitized, privacyFindings: sanitized.findings };
}

function needsCheck(key, evidence) { const item = evidence.find((entry) => entry.key === key); return Boolean(item && item.confidenceImpact !== 'supported'); }
function humanize(value) { return String(value || '').replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); }
function unique(values) { return [...new Set(values)]; }
