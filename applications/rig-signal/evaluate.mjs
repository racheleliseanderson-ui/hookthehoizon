import {
  classifyPrivacyField,
  rejectLocationSensitiveInput,
  resolveSourceState,
  sanitizePublicPayload
} from '../_shared/governance.mjs';

const IDENTITY_STATES = new Set(['primary_documentation', 'contributor_recollection', 'inferred', 'unknown']);
const MATURITY_STATES = new Set(['commercial', 'prototype', 'research', 'patent', 'concept', 'unknown']);
const EVIDENCE_STATES = new Set(['manufacturer_documented', 'independently_validated', 'field_tested', 'recollected', 'inferred', 'unknown']);
const HIGH_RISK_CAPABILITIES = new Set(['bite_detection', 'species_identification', 'fight_classification', 'catch_prediction']);

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

function capabilityAssessment(capability, identityEvidence) {
  const key = normalized(capability.key);
  const maturity = normalized(capability.maturity || 'unknown');
  const evidenceState = normalized(capability.evidenceState || 'unknown');

  if (!MATURITY_STATES.has(maturity)) return { maturity: 'invalid', credibility: 'unsupported', reason: 'invalid_maturity' };
  if (!EVIDENCE_STATES.has(evidenceState)) return { maturity, credibility: 'unsupported', reason: 'invalid_evidence_state' };

  let credibility = 'ambiguous';
  let reason = 'evidence_is_not_sufficient_for_field_performance';

  if (identityEvidence !== 'primary_documentation') {
    credibility = 'identity_unverified';
    reason = 'device_identity_is_not_primary_verified';
  } else if (evidenceState === 'independently_validated' || evidenceState === 'field_tested') {
    credibility = 'supported_with_conditions';
    reason = 'evidence_supports_bounded_capability_only';
  } else if (evidenceState === 'manufacturer_documented') {
    credibility = 'documented_claim';
    reason = 'manufacturer_documentation_confirms_claim_not_field_accuracy';
  } else if (evidenceState === 'recollected' || evidenceState === 'inferred') {
    credibility = 'unsupported';
    reason = 'recollection_or_inference_is_not_capability_evidence';
  }

  if (HIGH_RISK_CAPABILITIES.has(key) && !['independently_validated', 'field_tested'].includes(evidenceState)) {
    credibility = 'unsupported_high_risk_claim';
    reason = 'high_risk_capability_requires_controlled_validation';
  }

  if (maturity !== 'commercial') reason = `${reason}; maturity_remains_${maturity}`;
  return { maturity, credibility, reason };
}

function integrationReadiness({ identityEvidence, exportMethod, acceptedFields, localOnlyFields, sourceState }) {
  if (sourceState === 'unavailable') return 'unsupported';
  if (identityEvidence !== 'primary_documentation') return acceptedFields.length || localOnlyFields.length ? 'manual_bridge' : 'unsupported';
  if (exportMethod && acceptedFields.length) return 'importable';
  if (exportMethod || acceptedFields.length || localOnlyFields.length) return 'documented';
  return 'manual_bridge';
}

export function evaluateRigSignal(input, now = new Date()) {
  const errors = [];
  if (!input?.deviceCategory) errors.push('deviceCategory is required');
  if (!IDENTITY_STATES.has(input?.identityEvidence)) errors.push('identityEvidence must be declared');
  if (!MATURITY_STATES.has(input?.deviceMaturity)) errors.push('deviceMaturity must be declared');
  if (!Array.isArray(input?.capabilities)) errors.push('capabilities must be an array');
  if (!Array.isArray(input?.dataFields)) errors.push('dataFields must be an array');
  if (!Array.isArray(input?.sourceIds) || input.sourceIds.length === 0) errors.push('sourceIds are required');

  const { dataFields: _dataFieldsForPrivacyClassification, ...locationInspectable } = input;
  const locationCheck = rejectLocationSensitiveInput(locationInspectable);
  if (!locationCheck.ok) errors.push('location-sensitive input is prohibited');
  if (errors.length) return { status: 'invalid', errors, privacyFindings: locationCheck.errors || [] };

  const sourceState = resolveSourceState(input.sourceFreshness || {}, now);
  const capabilityResults = input.capabilities.map((capability) => {
    const assessment = capabilityAssessment(capability, input.identityEvidence);
    return {
      key: normalized(capability.key),
      maturity: assessment.maturity,
      evidenceState: normalized(capability.evidenceState || 'unknown'),
      credibility: assessment.credibility,
      reason: assessment.reason,
      limitations: capability.limitations || []
    };
  });

  const acceptedFields = [];
  const localOnlyFields = [];
  const rejectedFields = [];

  for (const field of input.dataFields) {
    const key = normalized(field.key || field);
    if (!key) {
      rejectedFields.push({ key, reason: 'missing_field_key' });
      continue;
    }
    const base = { key, unit: field.unit || null, quality: field.quality || 'unknown' };
    const fieldLocationCheck = rejectLocationSensitiveInput({ [key]: field.value ?? 'field' });
    if (!fieldLocationCheck.ok) {
      rejectedFields.push({ ...base, reason: 'sensitive_location_or_prohibited_field' });
      continue;
    }
    const disposition = classifyPrivacyField(field);
    if (disposition.disposition === 'accepted') acceptedFields.push(base);
    else if (disposition.disposition === 'local_only') localOnlyFields.push(base);
    else rejectedFields.push({ ...base, reason: disposition.reason });
  }

  const readiness = integrationReadiness({
    identityEvidence: input.identityEvidence,
    exportMethod: input.exportMethod,
    acceptedFields,
    localOnlyFields,
    sourceState: sourceState.state
  });

  const warnings = [];
  if (!input.exportMethod) warnings.push('No documented export method; manual bridge remains the baseline.');
  if (!input.offlineBehavior) warnings.push('Offline behavior is unknown.');
  if (!input.powerProfile) warnings.push('Power and battery behavior are unknown.');
  if (!input.environmentalRating) warnings.push('Water, corrosion, temperature, and durability limits are unknown.');
  if (sourceState.state !== 'fresh') warnings.push(`Device source state is ${sourceState.state}.`);
  if (capabilityResults.some((capability) => capability.credibility.startsWith('unsupported'))) {
    warnings.push('At least one capability lacks sufficient evidence for field-performance use.');
  }

  const normalizedEventPreview = acceptedFields.map((field, index) => ({
    schemaVersion: '1.0.0',
    eventId: `preview-${index + 1}`,
    deviceProfileId: input.deviceProfileId || 'preview-device',
    eventType: `device.${field.key}`,
    recordedAt: now.toISOString(),
    value: null,
    unit: field.unit,
    quality: field.quality,
    calibrationState: 'unknown',
    source: 'device_import',
    privacy: {
      classification: 'public_safe',
      retention: 'none',
      shareAllowed: true,
      analyticsAllowed: true
    },
    locationIncluded: false
  }));

  const result = {
    status: 'evaluated',
    applicationId: 'HTH-RS-001',
    contractVersion: '1.0.0',
    ruleVersion: '0.2.0-preview',
    evaluatedAt: now.toISOString(),
    locationData: 'not_collected',
    identity: {
      evidenceState: input.identityEvidence,
      exactModelClaimsAllowed: input.identityEvidence === 'primary_documentation'
    },
    deviceMaturity: input.deviceMaturity,
    sourceIds: [...input.sourceIds],
    sourceFreshness: sourceState,
    integrationReadiness: readiness,
    capabilityCredibility: capabilityResults,
    dataHandling: { acceptedFields, localOnlyFields, rejectedFields },
    normalizedEventPreview,
    warnings,
    interpretation: 'Data importability, capability evidence, field accuracy, and recommendation suitability are separate. This assessment does not prove bite detection, species identity, fight classification, or catch outcomes.'
  };

  const publicPayload = sanitizePublicPayload(result);
  return { ...publicPayload.sanitized, privacyFindings: publicPayload.findings };
}
