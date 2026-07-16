const IDENTITY_STATES = new Set(['primary_evidence', 'contributor_recollection', 'inferred', 'unknown']);

function finite(value) {
  return Number.isFinite(value);
}

function within(value, min, max) {
  return finite(value) && finite(min) && finite(max) && value >= min && value <= max;
}

export function evaluateSystemCompatibility(input) {
  const errors = [];
  if (!input.useClass) errors.push('useClass is required');
  if (!input.rod) errors.push('rod properties are required');
  if (!input.reel) errors.push('reel properties are required');
  if (!input.mainLine) errors.push('mainLine properties are required');
  if (!input.terminal) errors.push('terminal or lure properties are required');
  if (!IDENTITY_STATES.has(input.identityEvidence)) errors.push('identityEvidence must be declared');
  if (input.exactLocation || input.coordinates || input.latitude || input.longitude) errors.push('exact location data is prohibited');
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
    checks.push({ key: 'rod_lure_rating', passed, detail: `${terminal.weightOz} oz against ${rod.lureMinOz}-${rod.lureMaxOz} oz` });
    if (!passed) failures.push('terminal_weight_outside_rod_rating');
  } else unknowns.push('rod_lure_rating');

  if (finite(main.strengthLb) && finite(rod.lineMinLb) && finite(rod.lineMaxLb)) {
    const passed = within(main.strengthLb, rod.lineMinLb, rod.lineMaxLb);
    checks.push({ key: 'rod_line_rating', passed, detail: `${main.strengthLb} lb against ${rod.lineMinLb}-${rod.lineMaxLb} lb` });
    if (!passed) failures.push('main_line_outside_rod_rating');
  } else unknowns.push('rod_line_rating');

  if (finite(reel.capacityYards) && finite(input.requiredLineYards)) {
    const passed = reel.capacityYards >= input.requiredLineYards;
    checks.push({ key: 'reel_capacity', passed, detail: `${reel.capacityYards} yd capacity against ${input.requiredLineYards} yd requirement` });
    if (!passed) failures.push('reel_capacity_insufficient');
  } else unknowns.push('reel_capacity_requirement');

  if (finite(leader.strengthLb) && finite(main.strengthLb)) {
    const ratio = leader.strengthLb / main.strengthLb;
    const passed = ratio >= 0.5 && ratio <= 2;
    checks.push({ key: 'line_leader_ratio', passed, detail: `leader/main strength ratio ${ratio.toFixed(2)}` });
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
    tier,
    identity: {
      evidenceState: input.identityEvidence,
      useExactModelSpecifications: input.identityEvidence === 'primary_evidence',
      qualification: input.identityEvidence === 'primary_evidence'
        ? 'Exact identity may be used if the recorded properties match the primary source.'
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
      'Increase distance/load gradually and inspect line, leader, knot, guide, and terminal behavior.',
      'Record conditions, duration, failures, and changes before forming a gear verdict.'
    ],
    confidence: { score: confidenceScore, band: confidenceBand, explanation: 'Confidence reflects known equipment properties, primary identity evidence, and condition completeness; it does not guarantee performance or catch results.' },
    locationData: 'not_collected',
    futureRoute: 'Honey Hole Intelligence remains blocked until the shared Stability Gate is approved.'
  };
}
