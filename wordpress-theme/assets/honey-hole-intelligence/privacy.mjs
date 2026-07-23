const SENSITIVE_KEYS = new Map([
  ['lat', 'sensitive_location_key'], ['latitude', 'sensitive_location_key'], ['lng', 'sensitive_location_key'],
  ['lon', 'sensitive_location_key'], ['longitude', 'sensitive_location_key'], ['coordinates', 'sensitive_location_key'],
  ['coordinate', 'sensitive_location_key'], ['exactlocation', 'sensitive_location_key'], ['exact_location', 'sensitive_location_key'],
  ['gps', 'sensitive_location_key'], ['geolocation', 'sensitive_location_key'], ['geojson', 'sensitive_location_key'],
  ['waypoint', 'sensitive_location_key'], ['waypointid', 'sensitive_location_key'], ['waypoint_id', 'sensitive_location_key'],
  ['privatewatername', 'vulnerable_water_identifier'], ['private_water_name', 'vulnerable_water_identifier'],
  ['vulnerablewaterid', 'vulnerable_water_identifier'], ['vulnerable_water_id', 'vulnerable_water_identifier'],
  ['waterbodyid', 'vulnerable_water_identifier'], ['waterbody_id', 'vulnerable_water_identifier'],
  ['homewaterbodyids', 'vulnerable_water_identifier'], ['home_waterbody_ids', 'vulnerable_water_identifier'],
  ['accesspoint', 'private_access_instruction'], ['access_point', 'private_access_instruction'],
  ['privateaccessinstructions', 'private_access_instruction'], ['private_access_instructions', 'private_access_instruction'],
  ['gatecode', 'private_access_instruction'], ['gate_code', 'private_access_instruction'],
  ['lockboxcode', 'private_access_instruction'], ['lockbox_code', 'private_access_instruction'],
  ['parkingcoordinates', 'private_access_instruction'], ['parking_coordinates', 'private_access_instruction'],
  ['contributoridentity', 'contributor_sensitive'], ['contributor_identity', 'contributor_sensitive'],
  ['contributorname', 'contributor_sensitive'], ['contributor_name', 'contributor_sensitive'],
  ['contributoremail', 'contributor_sensitive'], ['contributor_email', 'contributor_sensitive'],
  ['contributorphone', 'contributor_sensitive'], ['contributor_phone', 'contributor_sensitive'],
  ['privatecontact', 'contributor_sensitive'], ['private_contact', 'contributor_sensitive']
]);

const PRIVACY_CLASSES = new Set(['public_safe', 'private', 'local_only', 'prohibited']);

function normalizedKey(value) {
  return String(value || '').replace(/[^a-z0-9_]/gi, '').toLowerCase();
}

function inspectString(value) {
  const text = String(value || '');
  const reasons = [];
  if (/\b-?\d{1,2}\.\d{4,}\s*[, ]\s*-?\d{1,3}\.\d{4,}\b/.test(text)) reasons.push('coordinate_pair');
  if (/\b\d{1,2}[°º]\s*\d{1,2}['′]\s*\d{1,2}(?:\.\d+)?["″]?\s*[NS]\b.*\b\d{1,3}[°º]\s*\d{1,2}['′]\s*\d{1,2}(?:\.\d+)?["″]?\s*[EW]\b/i.test(text)) reasons.push('dms_coordinate_pair');
  if (/https?:\/\/(?:www\.)?(?:google\.[^/]+\/maps|maps\.apple\.com|maps\.google\.com|what3words\.com)/i.test(text)) reasons.push('map_url');
  if (/\b(?:lat(?:itude)?|lon(?:gitude)?|lng)\s*[:=]\s*-?\d+(?:\.\d+)?/i.test(text)) reasons.push('coordinate_label');
  if (/\b[23456789CFGHJMPQRVWX]{4,}\+[23456789CFGHJMPQRVWX]{2,}\b/i.test(text)) reasons.push('plus_code');
  if (/\b(?:gate|lockbox|door)\s*(?:code|combination)\s*[:=#-]?\s*[a-z0-9-]{3,}\b/i.test(text)) reasons.push('private_access_instruction');
  if (/\b(?:use|take|follow)\s+(?:the\s+)?private\s+(?:road|drive|trail|gate)\b/i.test(text)) reasons.push('private_access_instruction');
  if (/\b(?:vulnerable|protected|private)[-_ ]?water(?:body)?[-_ ]?id\s*[:=#-]?\s*[a-z0-9-]+\b/i.test(text)) reasons.push('vulnerable_water_identifier');
  return [...new Set(reasons)];
}

export function inspectSensitiveLocation(value, path = '$', findings = []) {
  if (value === null || value === undefined) return findings;
  if (typeof value === 'string') {
    for (const reason of inspectString(value)) findings.push({ path, reason });
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectSensitiveLocation(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const nestedPath = `${path}.${key}`;
      const reason = SENSITIVE_KEYS.get(normalizedKey(key));
      if (reason) findings.push({ path: nestedPath, reason });
      inspectSensitiveLocation(nested, nestedPath, findings);
    }
  }
  return findings;
}

function cloneRedacted(value, path, findings) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const reasons = inspectString(value);
    if (reasons.length) {
      reasons.forEach((reason) => findings.push({ path, reason }));
      return '[redacted-sensitive]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => cloneRedacted(item, `${path}[${index}]`, findings));
  if (typeof value !== 'object') return value;

  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    const reason = SENSITIVE_KEYS.get(normalizedKey(key));
    if (reason) {
      findings.push({ path: nestedPath, reason });
      continue;
    }
    output[key] = cloneRedacted(nested, nestedPath, findings);
  }
  return output;
}

export function sanitizePublicPayload(value) {
  const findings = [];
  const sanitized = cloneRedacted(value, '$', findings);
  return { ok: findings.length === 0, sanitized, findings };
}

export function rejectSensitiveLocation(value) {
  const findings = inspectSensitiveLocation(value);
  return findings.length ? { ok: false, findings } : { ok: true, findings: [] };
}

export function classifyPrivacy(value) {
  const privacyClass = String(value || '').toLowerCase();
  if (!PRIVACY_CLASSES.has(privacyClass)) return { disposition: 'reject', reason: 'unknown_privacy_class' };
  if (privacyClass === 'prohibited') return { disposition: 'reject', reason: 'prohibited' };
  if (privacyClass === 'public_safe') return { disposition: 'public', reason: null };
  return { disposition: 'local', reason: null };
}
