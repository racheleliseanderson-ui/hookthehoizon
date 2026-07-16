const IDENTITY_STATES = new Set(['primary_documentation', 'contributor_recollection', 'inferred', 'unknown']);
const MATURITY_STATES = new Set(['commercial', 'prototype', 'research', 'patent', 'concept', 'unknown']);
const HIGH_RISK_CAPABILITIES = new Set(['bite_detection', 'species_identification', 'fight_classification', 'catch_prediction']);
const PROHIBITED_FIELDS = new Set(['latitude', 'longitude', 'coordinates', 'exact_location', 'private_water_name']);

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

function capabilityStatus(capability, identityEvidence) {
  const key = normalized(capability.key);
  const evidenceState = normalized(capability.evidenceState || 'unknown');
  const maturity = normalized(capability.maturity || 'unknown');

  if (!MATURITY_STATES.has(maturity)) return 'invalid_maturity';
  if (HIGH_RISK_CAPABILITIES.has(key) && evidenceState !== 'primary_documentation') {
    return maturity === 'commercial' ? 'unsupported_claim' : 'prototype_only';
  }
  if (evidenceState === 'primary_documentation' && identityEvidence === 'primary_documentation') {
    return 'documented';
  }
  if (maturity === 'prototype' || maturity === 'research' || maturity === 'patent' || maturity === 'concept') {
    return 'prototype_only';
  }
  return 'ambiguous';
}

function integrationTier({ identityEvidence, exportMethod, capabilityResults, acceptedFields }) {
  if (capabilityResults.some((capability) => capability.status === 'invalid_maturity')) return 'unsupported';
  if (identityEvidence === 'primary_documentation' && exportMethod && acceptedFields.length) return 'importable';
  if (identityEvidence === 'primary_documentation') return 'documented';
  if (capabilityResults.some((capability) => capability.status === 'prototype_only')) return 'prototype_only';
  if (acceptedFields.length) return 'manual_bridge';
  return 'unsupported';
}

export function evaluateRigSignal(input) {
  const errors = [];
  if (!input?.deviceCategory) errors.push('deviceCategory is required');
  if (!IDENTITY_STATES.has(input?.identityEvidence)) errors.push('identityEvidence must be declared');
  if (!Array.isArray(input?.capabilities)) errors.push('capabilities must be an array');
  if (!Array.isArray(input?.dataFields)) errors.push('dataFields must be an array');
  if (input?.exactLocation || input?.coordinates || input?.latitude || input?.longitude) {
    errors.push('exact location data is prohibited');
  }
  if (errors.length) return { status: 'invalid', errors };

  const capabilityResults = input.capabilities.map((capability) => ({
    key: normalized(capability.key),
    maturity: normalized(capability.maturity || 'unknown'),
    evidenceState: normalized(capability.evidenceState || 'unknown'),
    status: capabilityStatus(capability, input.identityEvidence),
    limitations: capability.limitations || []
  }));

  const acceptedFields = [];
  const localOnlyFields = [];
  const rejectedFields = [];

  for (const field of input.dataFields) {
    const key = normalized(field.key || field);
    const privacyClass = normalized(field.privacyClass || 'private');

    if (!key || PROHIBITED_FIELDS.has(key) || privacyClass === 'prohibited') {
      rejectedFields.push({ key, reason: 'sensitive_location_or_prohibited_field' });
      continue;
    }

    if (privacyClass === 'local_only' || privacyClass === 'private') {
      localOnlyFields.push({ key, unit: field.unit || null });
      continue;
    }

    acceptedFields.push({ key, unit: field.unit || null });
  }

  const tier = integrationTier({
    identityEvidence: input.identityEvidence,
    exportMethod: input.exportMethod,
    capabilityResults,
    acceptedFields
  });

  const warnings = [];
  if (!input.exportMethod) warnings.push('No documented export method; manual bridge may be required.');
  if (!input.offlineBehavior) warnings.push('Offline behavior is unknown.');
  if (!input.powerProfile) warnings.push('Power and battery behavior are unknown.');
  if (!input.environmentalRating) warnings.push('Water, corrosion, temperature, and durability limits are unknown.');
  if (capabilityResults.some((capability) => capability.status === 'unsupported_claim')) {
    warnings.push('At least one high-risk capability lacks primary documentation.');
  }

  return {
    status: 'evaluated',
    applicationId: 'HTH-RS-001',
    locationData: 'not_collected',
    identity: {
      evidenceState: input.identityEvidence,
      exactModelClaimsAllowed: input.identityEvidence === 'primary_documentation'
    },
    integrationReadiness: tier,
    capabilities: capabilityResults,
    dataHandling: {
      acceptedFields,
      localOnlyFields,
      rejectedFields
    },
    normalizedEventPreview: acceptedFields.map((field) => ({
      type: `device.${field.key}`,
      unit: field.unit,
      source: 'device_import',
      locationIncluded: false
    })),
    warnings,
    interpretation: 'Capability and data-integration assessment only; it does not prove field accuracy, bite detection, species identity, or catch outcomes.'
  };
}
