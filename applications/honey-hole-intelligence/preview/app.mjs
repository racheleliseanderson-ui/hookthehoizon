import { evaluateHoneyHole } from '../evaluate.mjs';

const form = document.querySelector('#hhi-form');
const status = document.querySelector('#hhi-status');
const section = document.querySelector('#hhi-result');
const result = section?.querySelector('[data-result]');
const allowedEvents = new Set([
  'official_regulation_opened',
  'trip_safety_check_complete',
  'conservation_controls_acknowledged',
  'public_safe_location_used'
]);

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const verifiedAt = data.get('verifiedAt') ? `${data.get('verifiedAt')}T12:00:00Z` : null;
  const sourceUrl = safeUrl(data.get('sourceUrl'));
  const officialStatus = verifiedAt && sourceUrl ? 'official_current' : 'unverified';
  const fact = (value, status = officialStatus) => ({ value: value === 'unknown' ? null : value, status: value === 'contradicted' ? 'contradicted' : status, verifiedAt, sourceUrl });
  const input = {
    publicRegion: String(data.get('publicRegion') || '').trim(),
    tripType: data.get('tripType'),
    gearReady: data.get('gearReady') === 'on',
    backupPlanReady: data.get('backupPlanReady') === 'on',
    facts: {
      closure: fact(data.get('closure')),
      hazard: fact(data.get('hazard')),
      weather: fact(data.get('weather')),
      waterCondition: fact(data.get('waterCondition')),
      regulation: fact(data.get('regulation')),
      permit: fact(null, 'unverified'),
      access: fact(data.get('access')),
      ownership: fact(null, 'unverified'),
      conservation: fact(data.get('conservation'))
    }
  };
  render(evaluateHoneyHole(input), sourceUrl);
});

function render(output, sourceUrl) {
  if (!section || !result || !status) return;
  section.hidden = false;

  if (output.status === 'invalid') {
    result.innerHTML = `<div class="error" role="alert"><p>No trip-readiness result was produced.</p><ul>${output.errors.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
    status.textContent = 'Required public-region information is missing.';
    return;
  }

  if (output.status === 'sensitive_location_rejected') {
    result.innerHTML = `<div class="error" role="alert"><h3>Location input rejected</h3><p>${escapeHtml(output.message)}</p></div>`;
    status.textContent = 'Exact or inference-enabling location input was rejected before evaluation.';
    return;
  }

  const hardStops = list(output.hardStops, 'No hard stop recorded.');
  const unknowns = list(output.unknownFields.map(humanize), 'None recorded.');
  const stale = list(output.staleFields.map(humanize), 'None recorded.');
  const questions = list(output.officialQuestions, 'No additional official-source question was generated.');
  result.innerHTML = `
    <article>
      <p class="eyebrow">${escapeHtml(humanize(output.decisionState))}</p>
      <h3>${escapeHtml(output.publicRegion)}</h3>
      <p>${escapeHtml(output.boundary)}</p>
      <h4>Hard stops</h4>${hardStops}
      <h4>Unknown facts</h4>${unknowns}
      <h4>Stale facts</h4>${stale}
      <h4>Questions to verify</h4>${questions}
      <p><strong>Backup plan:</strong> ${escapeHtml(output.backupPlan)}</p>
      ${sourceUrl ? `<p><a href="${escapeAttribute(sourceUrl)}" target="_blank" rel="noopener noreferrer" data-official-regulation>Open official source</a></p>` : '<p>No official source URL was supplied.</p>'}
      <button type="button" data-conservation-acknowledged>I reviewed the conservation controls</button>
      <button type="button" data-print>Print public-safe checklist</button>
    </article>`;

  status.textContent = `${humanize(output.decisionState)}. ${output.criticalUnknowns.length} critical fact(s) need attention.`;
  emit('trip_safety_check_complete', {
    decisionState: output.decisionState,
    hardStopCount: output.hardStops.length,
    criticalUnknownCount: output.criticalUnknowns.length
  });
  emit('public_safe_location_used', { locationAccepted: true, privacyFindingCount: output.privacyFindings.length });

  result.querySelector('[data-official-regulation]')?.addEventListener('click', () => emit('official_regulation_opened', { sourceType: 'official', decisionState: output.decisionState }));
  result.querySelector('[data-conservation-acknowledged]')?.addEventListener('click', () => {
    status.textContent = 'Conservation controls acknowledged. Recheck before departure if conditions or access change.';
    emit('conservation_controls_acknowledged', { decisionState: output.decisionState });
  });
  result.querySelector('[data-print]')?.addEventListener('click', () => window.print());
}

function emit(name, payload) {
  if (!allowedEvents.has(name)) return;
  const values = Object.fromEntries(Object.entries(payload || {}).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)));
  window.dispatchEvent(new CustomEvent('hth:analytics', { detail: { name, applicationId: 'HHI-001', schemaVersion: '0.1.0', values } }));
}
function list(values, fallback) { return `<ul>${values.length ? values.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : `<li>${escapeHtml(fallback)}</li>`}</ul>`; }
function humanize(value) { return String(value || '').replaceAll('_', ' '); }
function safeUrl(value) { try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function escapeAttribute(value) { return escapeHtml(value); }
