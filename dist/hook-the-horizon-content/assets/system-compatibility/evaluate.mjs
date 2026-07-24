const IDENTITY_STATES = new Set(['primary_evidence', 'contributor_recollection', 'inferred', 'unknown']);
const PROHIBITED_LOCATION_KEYS = /^(exact.?location|coordinates?|latitude|longitude|lat|lng|private.?water|access.?code|gate.?code)$/i;

function finite(value) {
  return Number.isFinite(value);
}

function nonNegative(value) {
  return finite(value) && value >= 0;
}

function within(value, min, max) {
  return finite(value) && finite(min) && finite(max) && value >= min && value <= max;
}

function addRangeError(errors, object, minKey, maxKey, label) {
  const min = object?.[minKey];
  const max = object?.[maxKey];
  if (min == null && max == null) return;
  if (!nonNegative(min) || !nonNegative(max)) {
    errors.push(`${label} must use non-negative numeric minimum and maximum values`);
    return;
  }
  if (min > max) errors.push(`${label} minimum cannot exceed maximum`);
}

function findProtectedLocationData(value, path = []) {
  const findings = [];
  if (!value || typeof value !== 'object') return findings;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (PROHIBITED_LOCATION_KEYS.test(key) && child !== null && child !== '' && child !== false) {
      findings.push(nextPath.join('.'));
    }
    if (child && typeof child === 'object') findings.push(...findProtectedLocationData(child, nextPath));
  }
  return findings;
}

function makeCheck(key, passed, detail, consequence = 'review') {
  return { key, passed, detail, consequence };
}

export function evaluateSystemCompatibility(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return { status: 'invalid', errors: ['input object is required'] };
  if (!input.useClass) errors.push('useClass is required');
  if (!input.rod) errors.push('rod properties are required');
  if (!input.reel) errors.push('reel properties are required');
  if (!input.mainLine) errors.push('mainLine properties are required');
  if (!input.terminal) errors.push('terminal or lure properties are required');
  if (!IDENTITY_STATES.has(input.identityEvidence)) errors.push('identityEvidence must be declared');

  addRangeError(errors, input.rod, 'lureMinOz', 'lureMaxOz', 'rod lure rating');
  addRangeError(errors, input.rod, 'lineMinLb', 'lineMaxLb', 'rod line rating');

  for (const [label, value] of [
    ['main line strength', input.mainLine?.strengthLb],
    ['leader strength', input.leader?.strengthLb],
    ['terminal weight', input.terminal?.weightOz],
    ['reel capacity', input.reel?.capacityYards],
    ['required line', input.requiredLineYards],
  ]) {
    if (value != null && !nonNegative(value)) errors.push(`${label} must be a non-negative number`);
  }

  const protectedLocationPaths = findProtectedLocationData(input);
  if (protectedLocationPaths.length) {
    errors.push(`exact location data is prohibited (${protectedLocationPaths.join(', ')})`);
  }
  if (errors.length) return { status: 'invalid', errors };

  const checks = [];
  const failures = [];
  const conditions = [];
  const unknowns = [];

  const rod = input.rod;
  const reel = input.reel;
  const main = input.mainLine;
  const leader = input.leader || {};
  const terminal = input.terminal;
  const field = input.fieldConditions || {};

  if (finite(terminal.weightOz) && finite(rod.lureMinOz) && finite(rod.lureMaxOz)) {
    const passed = within(terminal.weightOz, rod.lureMinOz, rod.lureMaxOz);
    checks.push(makeCheck('rod_lure_rating', passed, `${terminal.weightOz} oz against ${rod.lureMinOz}-${rod.lureMaxOz} oz`, 'stop'));
    if (!passed) failures.push('terminal_weight_outside_rod_rating');
  } else unknowns.push('rod_lure_rating');

  if (finite(main.strengthLb) && finite(rod.lineMinLb) && finite(rod.lineMaxLb)) {
    const passed = within(main.strengthLb, rod.lineMinLb, rod.lineMaxLb);
    checks.push(makeCheck('rod_line_rating', passed, `${main.strengthLb} lb against ${rod.lineMinLb}-${rod.lineMaxLb} lb`, 'stop'));
    if (!passed) failures.push('main_line_outside_rod_rating');
  } else unknowns.push('rod_line_rating');

  if (finite(reel.capacityYards) && finite(input.requiredLineYards)) {
    const passed = reel.capacityYards >= input.requiredLineYards;
    checks.push(makeCheck('reel_capacity', passed, `${reel.capacityYards} yd capacity against ${input.requiredLineYards} yd requirement`, 'stop'));
    if (!passed) failures.push('reel_capacity_insufficient');
  } else unknowns.push('reel_capacity_requirement');

  if (finite(leader.strengthLb) && finite(main.strengthLb) && main.strengthLb > 0) {
    const ratio = leader.strengthLb / main.strengthLb;
    const passed = ratio >= 0.5 && ratio <= 2;
    checks.push(makeCheck('line_leader_ratio', passed, `leader/main strength ratio ${ratio.toFixed(2)}`, 'review'));
    if (!passed) conditions.push('line_leader_strength_ratio_requires_connection_and_breakpoint_review');
  } else unknowns.push('line_leader_relationship');

  if (!input.connectionType) unknowns.push('line_leader_or_terminal_connection');

  if (field.cover === 'heavy' && main.material === 'monofilament' && (main.strengthLb || 0) < 12) {
    conditions.push('heavy_cover_may_exceed_main_line_abrasion_or_strength_margin');
  }
  if (field.current === 'strong' && (terminal.weightOz || 0) < 0.25) {
    conditions.push('terminal_weight_may_not_control_depth_or_presentation_in_strong_current');
  }
  if (field.wind === 'strong' && input.handlingGoal === 'casting_distance' && rod.action === 'extra_fast') {
    conditions.push('extra_fast_action_and_strong_wind_may_reduce_load_tolerance_for_some_casting_styles');
  }

  const identityQualified = input.identityEvidence !== 'primary_evidence';
  if (identityQualified) unknowns.push('exact_product_identity_not_primary_verified');

  let tier = 'compatible';
  if (failures.length) tier = 'mismatch';
  else if (unknowns.length >= 4) tier = 'insufficient_information';
  else if (conditions.length >= 2 || identityQualified) tier = 'test_before_use';
  else if (conditions.length || unknowns.length) tier = 'compatible_with_conditions';

  const weakLinks = [...failures, ...conditions];
  if (!weakLinks.length && unknowns.length) weakLinks.push(`unknown:${unknowns[0]}`);

  const confidenceScore = failures.length
    ? Math.max(30, 75 - unknowns.length * 8)
    : Math.max(15, 100 - unknowns.length * 13 - conditions.length * 8 - (identityQualified ? 12 : 0));
  const confidenceBand = confidenceScore >= 80 ? 'strong' : confidenceScore >= 55 ? 'moderate' : confidenceScore >= 30 ? 'low' : 'insufficient';

  return {
    status: 'evaluated',
    applicationId: 'HTH-SC-001',
    schemaVersion: '0.2.0',
    ruleVersion: '0.2.0',
    tier,
    identity: {
      evidenceState: input.identityEvidence,
      useExactModelSpecifications: input.identityEvidence === 'primary_evidence',
      qualification: input.identityEvidence === 'primary_evidence'
        ? 'Exact identity may be used only when the recorded properties match the primary source.'
        : 'Evaluation uses only declared properties; exact model specifications are not assumed.'
    },
    checks,
    failures,
    conditions,
    unknowns,
    weakestSupportedLinks: weakLinks.slice(0, 3),
    fieldTestSequence: [
      'Verify labels, manuals, spool markings, and connection details before field use.',
      'Test drag, line lay, connection security, and casting with a safe low-load setup.',
      'Increase distance or load gradually and inspect line, leader, knot, guides, and terminal behavior.',
      'Record conditions, duration, failures, and changes before forming a gear verdict.'
    ],
    confidence: {
      score: confidenceScore,
      band: confidenceBand,
      explanation: 'Confidence reflects known equipment properties, primary identity evidence, and condition completeness; it does not guarantee performance, safety, legal compliance, or catch results.'
    },
    privacy: {
      locationData: 'not_collected',
      protectedFieldsRejected: true,
      publicOutput: 'broad conditions and equipment facts only'
    },
    limitations: [
      'Confirm manufacturer specifications before loading or use.',
      'Confirm current regulations, access, weather, water, and safety conditions separately.',
      'A compatible rating does not guarantee casting behavior, durability, landing success, or a catch.'
    ],
    relatedRoutes: ['honey-hole-intelligence', 'presentation-planner']
  };
}
