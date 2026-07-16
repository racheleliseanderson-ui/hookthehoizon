import { evaluatePresentationPlanner } from '../evaluate.mjs';
import { seedPresentations } from '../data/seed-presentations.mjs';

const STORAGE_KEY = 'hth-presentation-planner-preview-v1';
const form = document.querySelector('#planner-form');
const inventoryContainer = document.querySelector('#inventory');
const results = document.querySelector('#results');
const formStatus = document.querySelector('#form-status');
const resultStatus = document.querySelector('#result-status');
const printButton = document.querySelector('#print-plan');
const copyButton = document.querySelector('#copy-plan');
const clearButton = document.querySelector('#clear-data');
let lastResult = null;

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

function inventoryMarkup() {
  return seedPresentations.map((item) => `
    <label class="check">
      <input type="checkbox" name="inventory" value="${escapeHtml(item.inventoryId)}">
      ${escapeHtml(item.label)}
    </label>
  `).join('');
}

function selectedValues(selector) {
  return [...document.querySelectorAll(selector)].filter((item) => item.checked).map((item) => item.value);
}

function compatibilityMap() {
  return Object.fromEntries(seedPresentations.map((item) => [item.id, {
    applicationId: 'HTH-SC-001',
    tier: item.id === 'preview-suspending-pause' ? 'conditional' : 'compatible'
  }]));
}

function collectInput() {
  return {
    method: form.elements.method.value,
    waterType: form.elements.waterType.value,
    tripGoal: form.elements.tripGoal.value,
    structureBand: form.elements.structureBand.value,
    depthBand: form.elements.depthBand.value,
    conditions: selectedValues('#conditions input[type="checkbox"]'),
    inventoryOnly: true,
    inventoryIds: selectedValues('#inventory input[type="checkbox"]'),
    candidates: seedPresentations,
    systemCompatibility: compatibilityMap()
  };
}

function saveLocal(input) {
  const safeState = {
    method: input.method,
    waterType: input.waterType,
    tripGoal: input.tripGoal,
    structureBand: input.structureBand,
    depthBand: input.depthBand,
    conditions: input.conditions,
    inventoryIds: input.inventoryIds
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
}

function restoreLocal() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!state) return;
    for (const name of ['method', 'waterType', 'tripGoal', 'structureBand', 'depthBand']) {
      if (state[name] && form.elements[name]) form.elements[name].value = state[name];
    }
    for (const value of state.conditions || []) {
      const input = document.querySelector(`#conditions input[value="${CSS.escape(value)}"]`);
      if (input) input.checked = true;
    }
    for (const value of state.inventoryIds || []) {
      const input = document.querySelector(`#inventory input[value="${CSS.escape(value)}"]`);
      if (input) input.checked = true;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderPlan(plan) {
  const fitItems = (plan.whyItMayFit || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const failureItems = (plan.failureSignals || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `
    <article class="plan">
      <span class="role">${escapeHtml(readable(plan.role))}</span>
      <h3>${escapeHtml(plan.label)}</h3>
      <p><strong>Confidence:</strong> ${escapeHtml(plan.confidence)} · <strong>Compatibility:</strong> ${escapeHtml(readable(plan.compatibility.tier))}</p>
      <dl>
        <dt>Action</dt><dd>${escapeHtml(readable(plan.presentation.actionFamily))}</dd>
        <dt>Size</dt><dd>${escapeHtml(readable(plan.presentation.sizeBand))}</dd>
        <dt>Color</dt><dd>${escapeHtml(readable(plan.presentation.colorFamily))}</dd>
        <dt>Depth</dt><dd>${escapeHtml(readable(plan.presentation.targetDepth))}</dd>
        <dt>Cadence</dt><dd>${escapeHtml(readable(plan.presentation.cadence))}</dd>
        <dt>Change first</dt><dd>${escapeHtml(plan.presentation.firstAdjustment)}</dd>
      </dl>
      ${fitItems ? `<h4>Why it may fit</h4><ul>${fitItems}</ul>` : ''}
      ${failureItems ? `<h4>Failure signals</h4><ul>${failureItems}</ul>` : ''}
      <p><strong>No-purchase route:</strong> ${escapeHtml(plan.noPurchaseAlternative || 'Use the closest owned profile and document the trade-off.')}</p>
      <p><strong>Source state:</strong> ${escapeHtml(readable(plan.sourceFreshness.state))}. This is a preview record, not public field guidance.</p>
    </article>
  `;
}

function renderResult(result) {
  if (result.status !== 'evaluated') {
    results.className = 'empty';
    results.textContent = result.errors?.join(' ') || 'The plan could not be evaluated.';
    resultStatus.textContent = 'Correct the input and try again.';
    resultStatus.className = 'status error';
    return;
  }

  if (!result.plans.length) {
    results.className = 'empty';
    results.textContent = 'No owned, compatible, sourced preview candidates remain for this combination.';
    resultStatus.textContent = 'Try another depth, structure, or inventory selection.';
    return;
  }

  results.className = 'plan-grid';
  results.innerHTML = result.plans.map(renderPlan).join('') + `
    <aside class="unknown">
      <strong>Experiment rule:</strong> ${escapeHtml(result.experimentRule)}
    </aside>
  `;
  resultStatus.className = 'status';
  resultStatus.textContent = `${result.plans.length} plan${result.plans.length === 1 ? '' : 's'} created. Nothing was sent to a server.`;
  printButton.disabled = false;
  copyButton.disabled = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.className = 'status';
  const input = collectInput();
  if (!input.inventoryIds.length) {
    formStatus.className = 'status error';
    formStatus.textContent = 'Select at least one owned presentation profile.';
    return;
  }
  saveLocal(input);
  lastResult = evaluatePresentationPlanner(input);
  renderResult(lastResult);
});

printButton.addEventListener('click', () => window.print());

copyButton.addEventListener('click', async () => {
  if (!lastResult) return;
  const safeSummary = {
    applicationId: lastResult.applicationId,
    contractVersion: lastResult.contractVersion,
    interpretation: lastResult.interpretation,
    plans: lastResult.plans.map((plan) => ({
      role: plan.role,
      label: plan.label,
      confidence: plan.confidence,
      presentation: plan.presentation,
      noPurchaseAlternative: plan.noPurchaseAlternative
    })),
    locationData: 'not_collected'
  };
  try {
    await navigator.clipboard.writeText(JSON.stringify(safeSummary, null, 2));
    resultStatus.textContent = 'Safe summary copied. It contains no location or private notes.';
  } catch {
    resultStatus.textContent = 'Copy was unavailable. Use print instead.';
  }
});

clearButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  lastResult = null;
  results.className = 'empty';
  results.textContent = 'Local preview data cleared.';
  formStatus.textContent = 'Saved inventory and selections were removed from this browser.';
  resultStatus.textContent = '';
  printButton.disabled = true;
  copyButton.disabled = true;
});

inventoryContainer.innerHTML = inventoryMarkup();
restoreLocal();
