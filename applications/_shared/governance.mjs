const LOCATION_KEYS = new Set([
  'lat', 'latitude', 'lng', 'lon', 'longitude', 'coordinates', 'coordinate',
  'exactlocation', 'exact_location', 'gps', 'geolocation', 'geojson',
  'waypoint', 'waypointid', 'waypoint_id', 'privatewatername', 'private_water_name',
  'accesspoint', 'access_point', 'parkingcoordinates', 'parking_coordinates'
]);

const PUBLIC_PRIVACY_CLASSES = new Set(['public_safe']);
const LOCAL_PRIVACY_CLASSES = new Set(['private', 'local_only']);
const ALL_PRIVACY_CLASSES = new Set(['public_safe', 'private', 'local_only', 'prohibited']);
const SOURCE_AVAILABILITY = new Set(['available', 'outage', 'unavailable', 'migrating']);

function normalizedKey(value) {
  return String(value || '').replace(/[^a-z0-9_]/gi, '').toLowerCase();
}

function stringLocationReasons(value) {
  const text = String(value || '');
  const reasons = [];
  if (/\b-?\d{1,2}\.\d{4,}\s*[, ]\s*-?\d{1,3}\.\d{4,}\b/.test(text)) reasons.push('coordinate_pair');
  if (/https?:\/\/(?:www\.)?(?:google\.[^/]+\/maps|maps\.apple\.com|maps\.google\.com)/i.test(text)) reasons.push('map_url');
  if (/\b(?:lat(?:itude)?|lon(?:gitude)?|lng)\s*[:=]\s*-?\d+(?:\.\d+)?/i.test(text)) reasons.push('coordinate_label');
  if (/\b[23456789CFGHJMPQRVWX]{4,}\+[23456789CFGHJMPQRVWX]{2,}\b/i.test(text)) reasons.push('plus_code');
  return reasons;
}

export function inspectLocationRisk(value, path = '$', findings = []) {
  if (value === null || value === undefined) return findings;

  if (typeof value === 'string') {
    for (const reason of stringLocationReasons(value)) findings.push({ path, reason });
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectLocationRisk(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const normalized = normalizedKey(key);
      const nestedPath = `${path}.${key}`;
      if (LOCATION_KEYS.has(normalized)) findings.push({ path: nestedPath, reason: 'sensitive_location_key' });
      inspectLocationRisk(nested, nestedPath, findings);
    }
  }
  return findings;
}

function cloneAndRedact(value, path, findings) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const reasons = stringLocationReasons(value);
    if (reasons.length) {
      reasons.forEach((reason) => findings.push({ path, reason }));
      return '[redacted-location]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => cloneAndRedact(item, `${path}[${index}]`, findings));
  if (typeof value !== 'object') return value;

  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    const normalized = normalizedKey(key);
    const nestedPath = `${path}.${key}`;
    if (LOCATION_KEYS.has(normalized)) {
      findings.push({ path: nestedPath, reason: 'sensitive_location_key' });
      continue;
    }
    output[key] = cloneAndRedact(nested, nestedPath, findings);
  }
  return output;
}

export function sanitizePublicPayload(value) {
  const findings = [];
  const sanitized = cloneAndRedact(value, '$', findings);
  return { ok: findings.length === 0, sanitized, findings };
}

export function rejectLocationSensitiveInput(value) {
  const findings = inspectLocationRisk(value);
  return findings.length ? { ok: false, errors: findings } : { ok: true, errors: [] };
}

export function classifyPrivacyField(field) {
  const privacyClass = String(field?.privacyClass || '').toLowerCase();
  if (!ALL_PRIVACY_CLASSES.has(privacyClass)) {
    return { disposition: 'rejected', reason: 'unknown_privacy_class' };
  }
  if (privacyClass === 'prohibited') return { disposition: 'rejected', reason: 'prohibited_field' };
  if (PUBLIC_PRIVACY_CLASSES.has(privacyClass)) return { disposition: 'accepted', reason: null };
  if (LOCAL_PRIVACY_CLASSES.has(privacyClass)) return { disposition: 'local_only', reason: null };
  return { disposition: 'rejected', reason: 'unhandled_privacy_class' };
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveSourceState(record, now = new Date()) {
  const availability = String(record?.availability || 'available').toLowerCase();
  if (!SOURCE_AVAILABILITY.has(availability)) return { state: 'unknown', ageDays: null, reason: 'invalid_availability' };
  if (availability !== 'available') return { state: availability, ageDays: null, reason: 'source_availability' };

  const reviewedAt = validDate(record?.reviewedAt);
  if (!reviewedAt) return { state: 'unknown', ageDays: null, reason: 'missing_or_invalid_reviewed_at' };

  const current = now instanceof Date ? now : validDate(now);
  if (!current) return { state: 'unknown', ageDays: null, reason: 'invalid_now' };

  const explicitExpiry = validDate(record?.expiresAt);
  if (explicitExpiry && current > explicitExpiry) {
    return { state: 'stale', ageDays: Math.floor((current - reviewedAt) / 86400000), reason: 'explicit_expiry' };
  }

  const freshForDays = Number.isFinite(record?.freshForDays) ? record.freshForDays : 30;
  const agingAfterDays = Number.isFinite(record?.agingAfterDays)
    ? record.agingAfterDays
    : Math.max(1, Math.floor(freshForDays * 0.75));
  const ageDays = Math.max(0, Math.floor((current - reviewedAt) / 86400000));

  if (ageDays > freshForDays) return { state: 'stale', ageDays, reason: 'freshness_window_exceeded' };
  if (ageDays >= agingAfterDays) return { state: 'aging', ageDays, reason: 'approaching_freshness_limit' };
  return { state: 'fresh', ageDays, reason: 'within_freshness_window' };
}

export function freshnessPenalty(state) {
  return ({ fresh: 0, aging: 8, stale: 22, unknown: 14, outage: 28, unavailable: 35, migrating: 18 })[state] ?? 14;
}
