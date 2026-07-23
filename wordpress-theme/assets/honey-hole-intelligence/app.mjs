import { evaluateHoneyHole } from './evaluate.mjs';

const root = document.querySelector('[data-honey-hole-intelligence-app]');
const form = root?.querySelector('#hhi-form');
const status = root?.querySelector('#hhi-status');
const section = root?.querySelector('#hhi-result');
const result = section?.querySelector('[data-result]');
const submit = root?.querySelector('[type="submit"]');
const runtime = root?.querySelector('[data-runtime-status]');
const allowedEvents = new Set(['official_regulation_opened', 'trip_safety_check_complete', 'conservation_controls_acknowledged', 'public_safe_location_used']);

if (root && form && status && section && result && submit) {
  submit.disabled = true;
  initializeRuntime();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const reviewedAt = data.get('verifiedAt') ? `${data.get('verifiedAt')}T12:00:00Z` : null;
    const nextReviewAt = data.get('nextReviewAt') ? `${data.get('nextReviewAt')}T12:00:00Z` : null;
    const currentCheckUrl = safeUrl(data.get('sourceUrl'));
    const sourceOwner = String(data.get('sourceOwner') || '').trim() || null;
    const officialStatus = reviewedAt && nextReviewAt && currentCheckUrl && sourceOwner ? 'official_current' : 'unverified';
    const fact = (rawValue, statusOverride = null) => {
      const value = rawValue === 'unknown' || rawValue === 'unavailable' ? null : rawValue;
      const factStatus = statusOverride || (rawValue === 'contradicted' ? 'contradicted' : rawValue === 'unavailable' ? 'source_unavailable' : officialStatus);
      return { value, status: factStatus, reviewedAt, verifiedAt: reviewedAt, nextReviewAt, sourceOwner, currentCheckUrl, sourceUrl: currentCheckUrl };
    };
    render(evaluateHoneyHole({
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
        permit: fact(null, 'not_applicable'),
        access: fact(data.get('access')),
        ownership: fact(null, 'not_applicable'),
        conservation: fact(data.get('conservation'))
      }
    }), currentCheckUrl);
  });
}

async function initializeRuntime() {
  try {
    const response = await fetch(root.dataset.endpoint, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Runtime route returned ${response.status}`);
    const metadata = await response.json();
    if (metadata.applicationId !== 'HHI-001' || metadata.schemaVersion !== '0.2.0') throw new Error('Unsupported Honey Hole Intelligence contract');
    submit.disabled = false;
    status.textContent = 'Runtime verified. Complete the source owner, review dates, current check, and official-fact fields to begin.';
    if (runtime) runtime.textContent = `Live contract ${metadata.schemaVersion}; ${metadata.packetCount} public-region packets; source ownership, review dates, and same-day verification are required.`;
  } catch (error) {
    submit.disabled = true;
    status.textContent = 'Honey Hole Intelligence is unavailable because its governed runtime contract did not validate.';
    if (runtime) runtime.textContent = error instanceof Error ? error.message : 'Runtime validation failed.';
  }
}

function render(output, currentCheckUrl) {
  section.hidden = false;
  if (output.status === 'invalid') {
    result.innerHTML = `<div class="hhi-error" role="alert"><p>No trip-readiness result was produced.</p><ul>${output.errors.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
    status.textContent = 'Required public-region information is missing.';
    return;
  }
  if (output.status === 'sensitive_location_rejected') {
    result.innerHTML = `<div class="hhi-error" role="alert"><h3>Protected input rejected</h3><p>${escapeHtml(output.message)}</p></div>`;
    status.textContent = 'Sensitive or inference-enabling input was rejected before evaluation.';
    return;
  }

  const evidenceRows = output.evidence.filter((item) => !item.notApplicable).map((item) => `<tr><th scope="row">${escapeHtml(humanize(item.key))}</th><td>${escapeHtml(item.sourceOwner || 'Owner missing')}</td><td>${escapeHtml(dateLabel(item.reviewedAt))}</td><td>${escapeHtml(dateLabel(item.nextReviewAt))}</td><td>${escapeHtml(humanize(item.confidenceImpact))}</td></tr>`).join('');
  result.innerHTML = `<article>
    <p class="hhi-eyebrow">${escapeHtml(humanize(output.decisionState))}</p>
    <h3>${escapeHtml(output.publicRegion)}</h3>
    <p><strong>Evidence confidence:</strong> ${escapeHtml(humanize(output.confidence.level))}. ${escapeHtml(output.confidence.explanation)}</p>
    <p class="hhi-boundary">${escapeHtml(output.boundary)}</p>
    <h4>Hard stops</h4>${list(output.hardStops, 'No hard stop recorded.')}
    <h4>Unknown facts</h4>${list(output.unknownFields.map(humanize), 'None recorded.')}
    <h4>Stale facts</h4>${list(output.staleFields.map(humanize), 'None recorded.')}
    <h4>Unavailable sources</h4>${list(output.unavailableFields.map(humanize), 'None recorded.')}
    <h4>Questions to verify</h4>${list(output.officialQuestions, 'No additional official-source question was generated.')}
    <p><strong>Backup plan:</strong> ${escapeHtml(output.backupPlan)}</p>
    <div class="hhi-evidence-table" role="region" aria-label="Official source ownership and review dates" tabindex="0"><table><thead><tr><th>Fact</th><th>Source owner</th><th>Reviewed</th><th>Review again by</th><th>Confidence effect</th></tr></thead><tbody>${evidenceRows}</tbody></table></div>
    ${currentCheckUrl ? `<p><a href="${escapeAttribute(currentCheckUrl)}" target="_blank" rel="noopener noreferrer" data-official-regulation>Open current official check</a></p>` : '<p>No current official check URL was supplied.</p>'}
    <div class="hhi-actions"><button type="button" data-conservation-acknowledged>I reviewed the conservation controls</button><button type="button" data-print>Print public-safe checklist</button></div>
  </article>`;
  status.textContent = `${humanize(output.decisionState)}. Evidence confidence is ${humanize(output.confidence.level)}; ${output.criticalUnknowns.length} critical fact(s) need attention.`;
  emit('trip_safety_check_complete', { decisionState: output.decisionState, confidenceLevel: output.confidence.level, hardStopCount: output.hardStops.length, criticalUnknownCount: output.criticalUnknowns.length });
  emit('public_safe_location_used', { locationAccepted: true, privacyFindingCount: output.privacyFindings.length });
  result.querySelector('[data-official-regulation]')?.addEventListener('click', () => emit('official_regulation_opened', { sourceType: 'official', decisionState: output.decisionState }));
  result.querySelector('[data-conservation-acknowledged]')?.addEventListener('click', () => { status.textContent = 'Conservation controls acknowledged. Recheck before departure if conditions, sources, or access change.'; emit('conservation_controls_acknowledged', { decisionState: output.decisionState }); });
  result.querySelector('[data-print]')?.addEventListener('click', () => window.print());
}

function emit(name, payload) {
  if (!allowedEvents.has(name)) return;
  const values = Object.fromEntries(Object.entries(payload || {}).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)));
  window.dispatchEvent(new CustomEvent('hth:analytics', { detail: { name, applicationId: 'HHI-001', schemaVersion: '0.2.0', values } }));
}
function list(values, fallback) { return `<ul>${values.length ? values.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : `<li>${escapeHtml(fallback)}</li>`}</ul>`; }
function humanize(value) { return String(value || '').replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); }
function dateLabel(value) { const parsed = Date.parse(String(value || '')); return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : 'not recorded'; }
function safeUrl(value) { try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function escapeAttribute(value) { return escapeHtml(value); }
