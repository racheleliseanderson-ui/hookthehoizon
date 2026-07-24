import { generatePersonalizedPlan, summarizeMastery } from '../../_shared/personalization.mjs';
import { seedPresentations } from '../data/seed-presentations.mjs';

const CONSENT_KEY = 'hth-smart-mode-consent-v1';
const STATE_KEY = 'hth-smart-mode-state-v1';
const OUTCOME_KEY = 'hth-smart-mode-outcomes-v1';
const HISTORY_KEY = 'hth-smart-mode-recommendations-v1';
const SMART_MODE_KEYS = [CONSENT_KEY, STATE_KEY, OUTCOME_KEY, HISTORY_KEY];

const form = document.querySelector('#planner-form');
const inventoryRoot = document.querySelector('#inventory');
const resultsRoot = document.querySelector('#results');
const masteryRoot = document.querySelector('#mastery');
const briefRoot = document.querySelector('#brief');
const statusRoot = document.querySelector('#status');
const networkRoot = document.querySelector('#network-status');
const consentInput = document.querySelector('#save-consent');
const clearButton = document.querySelector('#clear-data');
const printButton = document.querySelector('#print-plan');
const copyButton = document.querySelector('#copy-plan');
const exportButton = document.querySelector('#export-plan');
const shareButton = document.querySelector('#share-plan');
let lastResult = null;
let sessionOutcomes = [];
let sessionHistory = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readable(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function hasStorageConsent() {
  return loadJson(CONSENT_KEY, false) === true;
}

function currentOutcomes() {
  return hasStorageConsent() ? loadJson(OUTCOME_KEY, []) : sessionOutcomes;
}

function currentHistory() {
  return hasStorageConsent() ? loadJson(HISTORY_KEY, []) : sessionHistory;
}

function selectedValues(selector) {
  return [...document.querySelectorAll(selector)].filter((input) => input.checked).map((input) => input.value);
}

function profileFromForm() {
  return {
    profileId: 'local-preview-profile',
    preferredSpecies: [form.elements.preferredSpecies.value],
    skillBand: form.elements.skillBand.value,
    tripGoals: [form.elements.tripGoal.value],
    preferredMethods: [form.elements.method.value],
    privacy: {
      classification: 'local_only',
      retention: hasStorageConsent() ? 'local_device_by_explicit_consent' : 'session_only',
      shareAllowed: false,
      analyticsAllowed: false
    }
  };
}

function conditionsFromForm() {
  return {
    method: form.elements.method.value,
    waterType: form.elements.waterType.value,
    tripGoal: form.elements.tripGoal.value,
    structureBand: form.elements.structureBand.value,
    depthBand: form.elements.depthBand.value,
    conditionBands: selectedValues('#conditions input[type="checkbox"]')
  };
}

function inventoryFromForm() {
  const selected = new Set(selectedValues('#inventory input[type="checkbox"]'));
  return seedPresentations
    .filter((item) => selected.has(item.inventoryId))
    .map((item) => ({
      itemId: item.inventoryId,
      itemType: item.supportedMethods.includes('fly_fishing') ? 'fly' : 'lure',
      label: item.label,
      quantity: 1,
      attributes: { previewCandidateId: item.id },
      privacy: {
        classification: 'local_only',
        retention: hasStorageConsent() ? 'local_device_by_explicit_consent' : 'session_only',
        shareAllowed: false,
        analyticsAllowed: false
      }
    }));
}

function renderInventory() {
  inventoryRoot.innerHTML = seedPresentations.map((item) => `
    <label class="check-card">
      <input type="checkbox" name="inventory" value="${escapeHtml(item.inventoryId)}">
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(readable(item.actionFamily))} · ${escapeHtml(readable(item.targetDepth))}</small>
      </span>
    </label>
  `).join('');
}

function saveFormState() {
  if (!hasStorageConsent()) return;
  saveJson(STATE_KEY, {
    preferredSpecies: form.elements.preferredSpecies.value,
    skillBand: form.elements.skillBand.value,
    method: form.elements.method.value,
    waterType: form.elements.waterType.value,
    tripGoal: form.elements.tripGoal.value,
    structureBand: form.elements.structureBand.value,
    depthBand: form.elements.depthBand.value,
    conditions: selectedValues('#conditions input[type="checkbox"]'),
    inventoryIds: selectedValues('#inventory input[type="checkbox"]')
  });
}

function restoreFormState() {
  if (!hasStorageConsent()) return;
  const state = loadJson(STATE_KEY, null);
  if (!state) return;
  for (const field of ['preferredSpecies', 'skillBand', 'method', 'waterType', 'tripGoal', 'structureBand', 'depthBand']) {
    if (state[field] && form.elements[field]) form.elements[field].value = state[field];
  }
  for (const value of state.conditions || []) {
    const input = document.querySelector(`#conditions input[value="${CSS.escape(value)}"]`);
    if (input) input.checked = true;
  }
  for (const value of state.inventoryIds || []) {
    const input = document.querySelector(`#inventory input[value="${CSS.escape(value)}"]`);
    if (input) input.checked = true;
  }
}

function clearPersistentSmartModeData({ clearConsent = true } = {}) {
  for (const key of SMART_MODE_KEYS) {
    if (!clearConsent && key === CONSENT_KEY) continue;
    localStorage.removeItem(key);
  }
}

function factorMarkup(factors = []) {
  const useful = factors.filter((factor) => factor.adjustment !== 0);
  return useful.map((factor) => `
    <li><span>${escapeHtml(readable(factor.factor))}</span><strong>${factor.adjustment > 0 ? '+' : ''}${escapeHtml(factor.adjustment)}</strong></li>
  `).join('');
}

function planMarkup(plan) {
  return `
    <article class="plan" data-plan-id="${escapeHtml(plan.id)}">
      <div class="plan-heading">
        <span class="role">${escapeHtml(readable(plan.role))}</span>
        <span class="confidence">${escapeHtml(plan.confidence)} confidence</span>
      </div>
      <h3>${escapeHtml(plan.label)}</h3>
      <p class="plan-line">${escapeHtml(readable(plan.presentation.actionFamily))} · ${escapeHtml(readable(plan.presentation.targetDepth))} · ${escapeHtml(readable(plan.presentation.cadence))}</p>
      <dl>
        <dt>Size</dt><dd>${escapeHtml(readable(plan.presentation.sizeBand))}</dd>
        <dt>Color</dt><dd>${escapeHtml(readable(plan.presentation.colorFamily))}</dd>
        <dt>Change first</dt><dd>${escapeHtml(plan.presentation.firstAdjustment)}</dd>
        <dt>Compatibility</dt><dd>${escapeHtml(readable(plan.compatibility))}</dd>
        <dt>Source state</dt><dd>${escapeHtml(readable(plan.sourceState))}</dd>
      </dl>
      <details>
        <summary>Why this ranked here</summary>
        <ul class="factor-list">${factorMarkup(plan.factors)}</ul>
      </details>
      <p><strong>No-purchase route:</strong> ${escapeHtml(plan.noPurchaseAlternative || 'Use the closest owned profile and document the trade-off.')}</p>
      <fieldset class="outcome-controls">
        <legend>After the test</legend>
        <button type="button" data-outcome="positive" data-candidate="${escapeHtml(plan.id)}">Worked</button>
        <button type="button" data-outcome="negative" data-candidate="${escapeHtml(plan.id)}">Did not work</button>
        <button type="button" data-outcome="inconclusive" data-candidate="${escapeHtml(plan.id)}">Inconclusive</button>
      </fieldset>
    </article>
  `;
}

function setResultActions(enabled) {
  for (const button of [printButton, copyButton, exportButton, shareButton]) button.disabled = !enabled;
}

function addRecommendationHistory(result) {
  const entry = {
    recommendationId: crypto.randomUUID?.() || `rec-${Date.now()}`,
    createdAt: new Date().toISOString(),
    candidateIds: result.plans.map((plan) => plan.id),
    ruleVersion: result.ruleVersion,
    acceptedCandidateId: null,
    privacy: {
      classification: 'local_only',
      retention: hasStorageConsent() ? 'local_device_by_explicit_consent' : 'session_only',
      shareAllowed: false,
      analyticsAllowed: false
    }
  };
  if (hasStorageConsent()) {
    const history = loadJson(HISTORY_KEY, []);
    history.unshift(entry);
    saveJson(HISTORY_KEY, history.slice(0, 50));
  } else {
    sessionHistory.unshift(entry);
    sessionHistory = sessionHistory.slice(0, 50);
  }
}

function renderResults(result) {
  if (result.status !== 'evaluated') {
    resultsRoot.className = 'empty';
    resultsRoot.textContent = result.errors?.join(' ') || 'The plan could not be evaluated.';
    statusRoot.textContent = 'Correct the input and try again.';
    statusRoot.className = 'status error';
    setResultActions(false);
    return;
  }

  if (!result.plans.length) {
    resultsRoot.className = 'empty';
    resultsRoot.textContent = 'No owned, sourced, compatible preview candidates remain for this combination.';
    statusRoot.textContent = 'Change inventory or context and run Smart Mode again.';
    setResultActions(false);
    return;
  }

  resultsRoot.className = 'plan-grid';
  resultsRoot.innerHTML = result.plans.map(planMarkup).join('');
  statusRoot.className = 'status';
  statusRoot.textContent = hasStorageConsent()
    ? `${result.plans.length} explainable plan${result.plans.length === 1 ? '' : 's'} created locally and saved on this device by consent. Nothing was sent to a server.`
    : `${result.plans.length} explainable plan${result.plans.length === 1 ? '' : 's'} created locally for this session. Nothing was saved or sent to a server.`;
  setResultActions(true);
  addRecommendationHistory(result);
  renderBrief();
}

function renderMastery() {
  const summary = summarizeMastery(currentOutcomes());
  masteryRoot.innerHTML = `
    <div><strong>${summary.experiments}</strong><span>controlled tests</span></div>
    <div><strong>${summary.positive}</strong><span>worked</span></div>
    <div><strong>${summary.negative}</strong><span>did not work</span></div>
    <div><strong>${summary.inconclusive}</strong><span>inconclusive</span></div>
    <div><strong>${summary.variablesTested}</strong><span>variables tested</span></div>
  `;
}

function renderBrief() {
  const outcomes = currentOutcomes();
  const history = currentHistory();
  const summary = summarizeMastery(outcomes);
  const mostRecent = outcomes[0];
  const retention = hasStorageConsent()
    ? `${history.length} recommendation set${history.length === 1 ? '' : 's'} remain on this device by consent.`
    : `${history.length} recommendation set${history.length === 1 ? '' : 's'} exist only in this session. Enable saving to retain future work.`;
  briefRoot.innerHTML = `
    <p><strong>Your current brief:</strong> ${summary.experiments ? `You have ${summary.experiments} controlled test${summary.experiments === 1 ? '' : 's'} recorded.` : 'No field tests are recorded yet.'}</p>
    <p>${mostRecent ? `The latest result was ${escapeHtml(readable(mostRecent.result))} for ${escapeHtml(readable(mostRecent.candidateId))}.` : 'Run a plan, change one major variable, and record the result.'}</p>
    <p>${retention}</p>
  `;
}

function recordOutcome(candidateId, result) {
  const plan = lastResult?.plans?.find((item) => item.id === candidateId);
  const entry = {
    outcomeId: crypto.randomUUID?.() || `outcome-${Date.now()}`,
    candidateId,
    result,
    recordedAt: new Date().toISOString(),
    exposure: 1,
    changedVariable: plan?.presentation?.firstAdjustment || null,
    privacy: {
      classification: 'local_only',
      retention: hasStorageConsent() ? 'local_device_by_explicit_consent' : 'session_only',
      shareAllowed: false,
      analyticsAllowed: false
    }
  };
  if (hasStorageConsent()) {
    const outcomes = loadJson(OUTCOME_KEY, []);
    outcomes.unshift(entry);
    saveJson(OUTCOME_KEY, outcomes.slice(0, 200));
  } else {
    sessionOutcomes.unshift(entry);
    sessionOutcomes = sessionOutcomes.slice(0, 200);
  }
  statusRoot.textContent = hasStorageConsent()
    ? `Recorded ${readable(result)} locally for ${plan?.label || candidateId}.`
    : `Recorded ${readable(result)} for this session only. Enable saving to retain future outcomes.`;
  renderMastery();
  renderBrief();
}

function publicPlanExport() {
  if (!lastResult?.plans?.length) return null;
  return {
    schemaVersion: '1.0.0',
    applicationId: 'HTH-PP-001',
    smartModeId: 'HTH-SM-001',
    ruleVersion: lastResult.ruleVersion,
    exportedAt: new Date().toISOString(),
    locationData: 'not_collected',
    privacyBoundary: 'No profile, exact location, inventory list, recommendation history, or outcomes are included.',
    interpretation: lastResult.interpretation,
    plans: lastResult.plans.map((plan) => ({
      role: plan.role,
      label: plan.label,
      confidence: plan.confidence,
      compatibility: plan.compatibility,
      evidenceState: plan.evidenceState,
      sourceState: plan.sourceState,
      sourceIds: plan.sourceIds,
      presentation: plan.presentation,
      whyItMayFit: plan.whyItMayFit,
      failureSignals: plan.failureSignals,
      noPurchaseAlternative: plan.noPurchaseAlternative
    })),
    unknowns: lastResult.unknowns,
    nextAction: lastResult.nextAction
  };
}

function planSummaryText() {
  const output = publicPlanExport();
  if (!output) return '';
  const lines = [
    'Hook the Horizon — Smart Mode field-test plan',
    `Rule version: ${output.ruleVersion}`,
    'No exact location, private profile, inventory list, history, or outcomes included.',
    ''
  ];
  output.plans.forEach((plan, index) => {
    lines.push(`${index + 1}. ${plan.label} — ${readable(plan.role)}`);
    lines.push(`Confidence: ${plan.confidence}; compatibility: ${readable(plan.compatibility)}; source: ${readable(plan.sourceState)}`);
    lines.push(`Presentation: ${readable(plan.presentation.actionFamily)}, ${readable(plan.presentation.targetDepth)}, ${readable(plan.presentation.cadence)}`);
    lines.push(`Change first: ${plan.presentation.firstAdjustment}`);
    if (plan.noPurchaseAlternative) lines.push(`No-purchase route: ${plan.noPurchaseAlternative}`);
    lines.push('');
  });
  if (output.unknowns?.length) lines.push(`Unknowns: ${output.unknowns.join('; ')}`);
  if (output.nextAction) lines.push(`Next action: ${output.nextAction}`);
  return lines.join('\n');
}

async function copyPlanSummary() {
  const text = planSummaryText();
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    statusRoot.textContent = 'Copied a public-safe plan summary with no exact location, private profile, inventory list, history, or outcomes.';
  } catch {
    statusRoot.textContent = 'Copy was blocked by this browser. Use Download JSON or Print / PDF instead.';
  }
}

function downloadJson() {
  const output = publicPlanExport();
  if (!output) return;
  const blob = new Blob([`${JSON.stringify(output, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hook-the-horizon-smart-mode-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  statusRoot.textContent = 'Downloaded public-safe JSON with no exact location, private profile, inventory list, history, or outcomes.';
}

function svgShareCard(plan) {
  const title = escapeHtml(plan.label);
  const role = escapeHtml(readable(plan.role));
  const action = escapeHtml(readable(plan.presentation.actionFamily));
  const depth = escapeHtml(readable(plan.presentation.targetDepth));
  const cadence = escapeHtml(readable(plan.presentation.cadence));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#092532"/>
    <circle cx="1040" cy="70" r="260" fill="#123f52" opacity="0.9"/>
    <path d="M0 455 C220 390 420 520 640 445 S980 400 1200 455 V630 H0 Z" fill="#123f52"/>
    <path d="M0 500 C260 435 420 560 690 490 S1000 455 1200 505" fill="none" stroke="#d2763c" stroke-width="8" opacity="0.95"/>
    <text x="80" y="92" fill="#d2763c" font-family="system-ui, sans-serif" font-size="28" font-weight="700" letter-spacing="3">HOOK THE HORIZON</text>
    <text x="80" y="170" fill="#edf2ef" font-family="system-ui, sans-serif" font-size="26" font-weight="700">${role}</text>
    <text x="80" y="250" fill="#ffffff" font-family="system-ui, sans-serif" font-size="58" font-weight="800">${title}</text>
    <text x="80" y="320" fill="#edf2ef" font-family="system-ui, sans-serif" font-size="34">${action} · ${depth} · ${cadence}</text>
    <text x="80" y="385" fill="#edf2ef" font-family="system-ui, sans-serif" font-size="25">Explainable plan from owned inventory. No exact location shared.</text>
    <text x="80" y="585" fill="#edf2ef" font-family="system-ui, sans-serif" font-size="24">hookthehorizon.blog</text>
  </svg>`;
}

function downloadShareCard() {
  const plan = lastResult?.plans?.[0];
  if (!plan) return;
  const blob = new Blob([svgShareCard(plan)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hook-the-horizon-${plan.id}.svg`;
  link.click();
  URL.revokeObjectURL(url);
  statusRoot.textContent = 'Downloaded a public-safe share card with no location, profile, inventory, or outcome data.';
}

function updateNetworkStatus() {
  networkRoot.textContent = navigator.onLine ? 'Online · preview remains local' : 'Offline · cached preview active';
  networkRoot.dataset.state = navigator.onLine ? 'online' : 'offline';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const inventory = inventoryFromForm();
  if (!inventory.length) {
    statusRoot.className = 'status error';
    statusRoot.textContent = 'Select at least one owned presentation profile.';
    return;
  }
  saveFormState();
  lastResult = generatePersonalizedPlan({
    profile: profileFromForm(),
    inventory,
    conditions: conditionsFromForm(),
    candidates: seedPresentations,
    outcomes: currentOutcomes()
  });
  renderResults(lastResult);
});

resultsRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-outcome]');
  if (!button) return;
  recordOutcome(button.dataset.candidate, button.dataset.outcome);
});

consentInput.addEventListener('change', () => {
  if (consentInput.checked) {
    saveJson(CONSENT_KEY, true);
    saveFormState();
    statusRoot.className = 'status';
    statusRoot.textContent = 'Local saving enabled by consent. Future profile selections, recommendation history, and outcomes will remain in this browser until cleared.';
  } else {
    clearPersistentSmartModeData();
    statusRoot.className = 'status';
    statusRoot.textContent = 'Local saving disabled and all persisted Smart Mode data deleted. Current on-screen work remains session-only.';
  }
  renderMastery();
  renderBrief();
});

clearButton.addEventListener('click', () => {
  clearPersistentSmartModeData();
  sessionOutcomes = [];
  sessionHistory = [];
  consentInput.checked = false;
  form.reset();
  lastResult = null;
  resultsRoot.className = 'empty';
  resultsRoot.textContent = 'Local profile, inventory, history, outcomes, and saving consent cleared.';
  statusRoot.textContent = 'This browser no longer holds Smart Mode data.';
  setResultActions(false);
  renderMastery();
  renderBrief();
});

printButton.addEventListener('click', () => window.print());
copyButton.addEventListener('click', copyPlanSummary);
exportButton.addEventListener('click', downloadJson);
shareButton.addEventListener('click', downloadShareCard);
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

renderInventory();
consentInput.checked = hasStorageConsent();
restoreFormState();
renderMastery();
renderBrief();
updateNetworkStatus();
setResultActions(false);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    networkRoot.textContent = 'Offline cache unavailable in this browser context';
  });
}
