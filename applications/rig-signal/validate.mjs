const REQUIRED = [
  'schemaVersion',
  'eventId',
  'deviceProfileId',
  'eventType',
  'recordedAt',
  'source',
  'quality',
  'calibrationState',
  'privacyClass',
  'locationIncluded'
];

const ALLOWED = new Set([
  ...REQUIRED,
  'deviceMaturity',
  'capabilityEvidence',
  'value',
  'unit',
  'measurementUncertainty',
  'retention',
  'limitations'
]);

const ENUMS = {
  deviceMaturity: new Set(['commercial', 'prototype', 'research', 'patent', 'concept', 'unknown']),
  capabilityEvidence: new Set(['manufacturer_documented', 'independently_validated', 'field_tested', 'recollected', 'inferred', 'unknown']),
  quality: new Set(['documented', 'validated', 'estimated', 'unknown', 'invalid']),
  calibrationState: new Set(['current', 'aging', 'stale', 'unknown', 'not_applicable']),
  source: new Set(['device_import', 'manual_entry', 'derived']),
  privacyClass: new Set(['public_safe', 'private', 'local_only', 'prohibited']),
  retention: new Set(['none', 'session', 'local_device', 'approved_server'])
};

const HIGH_RISK_EVENTS = new Set(['bite_detection', 'species_identification', 'fight_classification', 'catch_prediction']);

export function validateRigSignalEvent(event = {}) {
  const errors = [];
  const warnings = [];
  const limitations = Array.isArray(event.limitations) ? [...event.limitations] : [];

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return rejection(['event must be an object'], [], []);
  }

  for (const key of REQUIRED) {
    if (event[key] === undefined || event[key] === null || event[key] === '') {
      errors.push(`${key} is required`);
    }
  }

  for (const key of Object.keys(event)) {
    if (!ALLOWED.has(key)) errors.push(`${key} is not allowed by the event contract`);
  }

  if (event.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (event.locationIncluded !== false) errors.push('locationIncluded must be false');

  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (event[key] !== undefined && event[key] !== null && !allowed.has(event[key])) {
      errors.push(`${key} is unsupported`);
    }
  }

  if (event.recordedAt && Number.isNaN(Date.parse(event.recordedAt))) errors.push('recordedAt must be a valid date-time');
  if (event.measurementUncertainty !== null && event.measurementUncertainty !== undefined) {
    if (typeof event.measurementUncertainty !== 'number' || event.measurementUncertainty < 0) {
      errors.push('measurementUncertainty must be null or a non-negative number');
    }
  }

  if (event.privacyClass === 'prohibited') errors.push('privacyClass prohibited records must be rejected');
  if (event.quality === 'invalid') errors.push('invalid quality records must be rejected');

  if (HIGH_RISK_EVENTS.has(event.eventType) && event.capabilityEvidence !== 'independently_validated') {
    errors.push(`${event.eventType} requires independently_validated capability evidence`);
  }

  if (event.deviceMaturity === 'unknown') warnings.push('Device maturity is unknown.');
  if (['unknown', 'inferred', 'recollected'].includes(event.capabilityEvidence)) warnings.push('Capability evidence is insufficient for a field recommendation.');
  if (['aging', 'stale', 'unknown'].includes(event.calibrationState)) warnings.push(`Calibration state is ${event.calibrationState}.`);
  if (['estimated', 'unknown'].includes(event.quality)) warnings.push(`Measurement quality is ${event.quality}.`);
  if (event.measurementUncertainty === null || event.measurementUncertainty === undefined) warnings.push('Measurement uncertainty is not recorded.');
  if (!limitations.length) warnings.push('No event-specific limitation is recorded.');

  if (errors.length) return rejection(errors, warnings, limitations);

  const disposition = warnings.length ? 'review_required' : 'accepted';
  return {
    applicationId: 'HTH-RS-001',
    schemaVersion: '1.0.0',
    disposition,
    event: {
      schemaVersion: event.schemaVersion,
      eventId: event.eventId,
      deviceProfileId: event.deviceProfileId,
      eventType: event.eventType,
      recordedAt: event.recordedAt,
      deviceMaturity: event.deviceMaturity || 'unknown',
      capabilityEvidence: event.capabilityEvidence || 'unknown',
      value: event.value ?? null,
      unit: event.unit ?? null,
      quality: event.quality,
      calibrationState: event.calibrationState,
      measurementUncertainty: event.measurementUncertainty ?? null,
      source: event.source,
      privacyClass: event.privacyClass,
      retention: event.retention || 'none',
      locationIncluded: false,
      limitations
    },
    warnings,
    errors: [],
    recommendationEligibility: disposition === 'accepted' && !HIGH_RISK_EVENTS.has(event.eventType)
      ? 'bounded_observation_only'
      : 'not_eligible',
    nextActions: disposition === 'accepted'
      ? ['Keep the event separate from catch outcomes and current environmental truth.']
      : ['Resolve calibration, capability evidence, uncertainty, privacy, or quality gaps before using the event beyond a private review record.'],
    boundary: 'Rig Signal validates evidence records. It does not prove bite detection, species identification, fight classification, catch probability, access, regulations, or environmental conditions.'
  };
}

function rejection(errors, warnings, limitations) {
  return {
    applicationId: 'HTH-RS-001',
    schemaVersion: '1.0.0',
    disposition: 'rejected',
    event: null,
    errors,
    warnings,
    limitations,
    recommendationEligibility: 'not_eligible',
    nextActions: ['Correct the rejected contract, privacy, quality, calibration, or evidence condition before importing the event.'],
    boundary: 'No recommendation or inferred event was produced from rejected input.'
  };
}
