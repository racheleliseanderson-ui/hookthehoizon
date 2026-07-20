import { evaluateSystemCompatibility } from '../evaluate.mjs';

const form = document.querySelector('#compatibility-form');
const resultRoot = document.querySelector('#result');
const emptyRoot = document.querySelector('#empty-result');
const statusRoot = document.querySelector('#form-status');
const resetButton = document.querySelector('#reset');
const STORAGE_KEY = 'hth-system-compatibility-inputs-v1';

const tierLabels = {
  compatible: 'Compatible on declared ratings',
  compatible_with_conditions: 'Compatible with conditions',
  test_before_use: 'Test before use',
  mismatch: 'Rating mismatch',
  insufficient_information: 'More information required'
};

const findingLabels = {
  terminal_weight_outside_rod_rating: 'Terminal weight is outside the rod lure rating.',
  main_line_outside_rod_rating: 'Main-line strength is outside the rod line rating.',
  reel_capacity_insufficient: 'Reel capacity is below the declared line requirement.',
  line_leader_strength_ratio_requires_connection_and_breakpoint_review: 'Leader-to-main-line strength requires a connection and breakpoint review.',
  heavy_cover_may_exceed_main_line_abrasion_or_strength_margin: 'Heavy cover may exceed the declared line abrasion or strength margin.',
  terminal_weight_may_not_control_depth_or_presentation_in_strong_current: 'The declared terminal weight may not control depth or presentation in strong current.',
  extra_fast_action_and_strong_wind_may_reduce_load_tolerance_for_some_casting_styles: 'Extra-fast action and strong wind may reduce load tolerance for some casting styles.',
  rod_lure_rating: 'Rod lure rating is missing.',
  rod_line_rating: 'Rod line rating is missing.',
  reel_capacity_requirement: 'Reel capacity or required line length is missing.',
  line_leader_relationship: 'Main-line and leader relationship is incomplete.',
  line_leader_or_terminal_connection: 'Connection type is unknown.',
  exact_product_identity_not_primary_verified: 'Exact product identity is not verified by a primary source.'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function numberValue(name) {
  const value = form.elements.namedItem(name)?.value;
  if (value === '' || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildInput() {
  return {
    useClass: form.elements.useClass.value,
    identityEvidence: form.elements.identityEvidence.value,
    rod: {
      lineMinLb: numberValue('lineMinLb'),
      lineMaxLb: numberValue('lineMaxLb'),
      lureMinOz: numberValue('lureMinOz'),
      lureMaxOz: numberValue('lureMaxOz'),
      action: form.elements.rodAction.value
    },
    reel: { capacityYards: numberValue('capacityYards') },
    mainLine: {
      material: form.elements.mainMaterial.value,
      strengthLb: numberValue('mainStrengthLb')
    },
    leader: { strengthLb: numberValue('leaderStrengthLb') },
    terminal: { weightOz: numberValue('terminalWeightOz') },
    requiredLineYards: numberValue('requiredLineYards'),
    connectionType: form.elements.connectionType.value,
    fieldConditions: {
      cover: form.elements.cover.value,
      current: form.elements.current.value,
      wind: form.elements.wind.value
    },
    handlingGoal: form.elements.handlingGoal.value
  };
}

function list(items, emptyText) {
  if (!items?.length) return `<p>${escapeHtml(emptyText)}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(findingLabels[item] || item)}</li>`).join('')}</ul>`;
}

function renderInvalid(errors) {
  emptyRoot.hidden = true;
  resultRoot.hidden = false;
  resultRoot.innerHTML = `
    <div class="result-head"><div><span class="badge" data-tier="mismatch">Input stopped</span><h2 id="result-heading" class="result-tier">Correct the setup facts.</h2></div></div>
    <section class="result-section" aria-labelledby="input-errors"><h3 id="input-errors">Why evaluation stopped</h3>${list(errors, 'No errors reported.')}</section>
    <p>Nothing was saved or sent. Correct the affected values and run the check again.</p>`;
  statusRoot.textContent = 'Evaluation stopped because the input contains invalid or prohibited data.';
  statusRoot.className = 'status error';
}

function resultExplanation(result) {
  if (result.failures.length) return `The setup stopped on ${result.failures.length} manufacturer-rating mismatch${result.failures.length === 1 ? '' : 'es'}. Correct those before field testing.`;
  if (result.unknowns.length) return `${result.checks.filter((check) => check.passed).length} declared checks passed, but ${result.unknowns.length} unknown${result.unknowns.length === 1 ? '' : 's'} limit the conclusion.`;
  if (result.conditions.length) return `Declared ratings align, with ${result.conditions.length} condition-sensitive trade-off${result.conditions.length === 1 ? '' : 's'} to test before use.`;
  return 'All supported declared rating checks passed; field testing and current safety conditions still control actual use.';
}

function renderResult(result, input, saved) {
  const evaluatedAt = new Date().toISOString();
  const exportRecord = {
    portableFormat: 'hook-the-horizon-compatibility-setup',
    portableFormatVersion: 1,
    evaluatedAt,
    input,
    result
  };
  emptyRoot.hidden = true;
  resultRoot.hidden = false;

  const checks = result.checks.length
    ? `<div class="result-section"><h3>Rating checks</h3><div role="region" aria-label="Compatibility checks" tabindex="0"><table><thead><tr><th>Check</th><th>Result</th><th>Declared comparison</th></tr></thead><tbody>${result.checks.map((check) => `<tr><td>${escapeHtml(check.key.replaceAll('_', ' '))}</td><td class="${check.passed ? 'pass' : 'fail'}">${check.passed ? 'Pass' : check.consequence === 'stop' ? 'Stop' : 'Review'}</td><td>${escapeHtml(check.detail)}</td></tr>`).join('')}</tbody></table></div></div>`
    : '<div class="result-section"><h3>Rating checks</h3><p>No complete rating comparison could be made.</p></div>';

  resultRoot.innerHTML = `
    <div class="result-head">
      <div><span class="badge" data-tier="${escapeHtml(result.tier)}">${escapeHtml(result.tier.replaceAll('_', ' '))}</span><h2 id="result-heading" class="result-tier">${escapeHtml(tierLabels[result.tier] || result.tier)}</h2><p><strong>Why:</strong> ${escapeHtml(resultExplanation(result))}</p></div>
      <div class="actions"><button class="secondary" type="button" id="print-result">Print setup card</button><button class="ghost" type="button" id="download-result">Download portable setup</button></div>
    </div>
    <p>${escapeHtml(result.identity.qualification)}</p>
    <div class="metric-grid">
      <div class="metric"><strong>${escapeHtml(result.confidence.score)}</strong><span>Confidence score</span></div>
      <div class="metric"><strong>${escapeHtml(result.checks.filter((check) => check.passed).length)}</strong><span>Passed checks</span></div>
      <div class="metric"><strong>${escapeHtml(result.failures.length)}</strong><span>Hard stops</span></div>
      <div class="metric"><strong>${escapeHtml(result.unknowns.length)}</strong><span>Unknowns</span></div>
    </div>
    ${checks}
    <section class="result-section"><h3>Hard stops</h3>${list(result.failures, 'No declared manufacturer-rating stop was found.')}</section>
    <section class="result-section"><h3>Conditions and trade-offs</h3>${list(result.conditions, 'No additional condition flag was produced from the declared inputs.')}</section>
    <section class="result-section"><h3>Unknowns to resolve</h3>${list(result.unknowns, 'No required unknown was recorded.')}</section>
    <section class="result-section"><h3>Weakest supported links</h3>${list(result.weakestSupportedLinks, 'No weak link was identified from the declared facts.')}</section>
    <section class="result-section"><h3>Field-test sequence</h3><ol>${result.fieldTestSequence.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
    <section class="result-section"><h3>Limitations</h3>${list(result.limitations, 'No limitation text available.')}</section>
    <details><summary>Evidence, privacy, and rule record</summary><p><strong>Application:</strong> ${escapeHtml(result.applicationId)} · <strong>Schema:</strong> ${escapeHtml(result.schemaVersion)} · <strong>Rules:</strong> ${escapeHtml(result.ruleVersion)}</p><p>${escapeHtml(result.confidence.explanation)}</p><p><strong>Privacy:</strong> exact location is not collected; protected fields are rejected; public output is limited to broad conditions and equipment facts.</p><p><strong>Evaluated:</strong> ${escapeHtml(evaluatedAt)}</p></details>`;

  document.querySelector('#print-result').addEventListener('click', () => window.print());
  document.querySelector('#download-result').addEventListener('click', () => {
    const blob = new Blob([`${JSON.stringify(exportRecord, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hook-the-horizon-compatibility-setup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  statusRoot.textContent = saved
    ? `Compatibility check complete: ${tierLabels[result.tier] || result.tier}. Inputs were saved locally for return use.`
    : `Compatibility check complete: ${tierLabels[result.tier] || result.tier}. Local storage is unavailable, so inputs were not saved.`;
  statusRoot.className = 'status';
}

function saveForm() {
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

function restoreForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return;
    for (const [name, value] of Object.entries(saved)) {
      const control = form.elements.namedItem(name);
      if (control && typeof value === 'string') control.value = value;
    }
    statusRoot.textContent = 'Saved setup inputs restored from this browser.';
  } catch {
    statusRoot.textContent = 'Local storage is unavailable. The builder still works, but inputs will not persist on this device.';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    statusRoot.textContent = 'Complete the required numeric ratings before checking compatibility.';
    statusRoot.className = 'status error';
    return;
  }
  const input = buildInput();
  const evaluation = evaluateSystemCompatibility(input);
  if (evaluation.status === 'invalid') {
    renderInvalid(evaluation.errors);
    return;
  }
  const saved = saveForm();
  renderResult(evaluation, input, saved);
});

resetButton.addEventListener('click', () => {
  form.reset();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  resultRoot.hidden = true;
  resultRoot.replaceChildren();
  emptyRoot.hidden = false;
  statusRoot.textContent = 'Saved setup inputs cleared.';
  statusRoot.className = 'status';
  form.elements.useClass.focus();
});

restoreForm();
document.documentElement.dataset.appReady = 'true';