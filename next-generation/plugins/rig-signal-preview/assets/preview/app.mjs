import { validateRigSignalEvent } from './validate.mjs';

const form = document.querySelector('#rig-signal-form');
const fixture = document.querySelector('#fixture');
const status = document.querySelector('#status');
const empty = document.querySelector('#empty');
const result = document.querySelector('#result');

const fixtures = {
  manual: { deviceProfileId:'manual-thermometer-001',eventType:'water_temperature',recordedAt:'2026-07-20T14:00',deviceMaturity:'commercial',capabilityEvidence:'field_tested',value:'61.4',unit:'degF',quality:'validated',calibrationState:'current',measurementUncertainty:'0.5',source:'manual_entry',privacyClass:'local_only',retention:'local_device',limitation:'Manual reading represents one time and one location-free observation.',locationIncluded:false },
  prototype: { deviceProfileId:'prototype-tip-sensor-001',eventType:'rod_tip_vibration',recordedAt:'2026-07-20T14:05',deviceMaturity:'prototype',capabilityEvidence:'field_tested',value:'0.42',unit:'relative_signal',quality:'estimated',calibrationState:'aging',measurementUncertainty:'0.2',source:'device_import',privacyClass:'local_only',retention:'session',limitation:'Signal has not been independently validated as a bite or species indicator.',locationIncluded:false },
  privacy: { deviceProfileId:'unknown-device-001',eventType:'depth_observation',recordedAt:'2026-07-20T14:10',deviceMaturity:'unknown',capabilityEvidence:'unknown',value:'12',unit:'feet',quality:'unknown',calibrationState:'unknown',measurementUncertainty:'',source:'device_import',privacyClass:'prohibited',retention:'none',limitation:'Privacy class is prohibited and the record cannot enter the application.',locationIncluded:false },
  prediction: { deviceProfileId:'commercial-sensor-002',eventType:'catch_prediction',recordedAt:'2026-07-20T14:15',deviceMaturity:'commercial',capabilityEvidence:'manufacturer_documented',value:'0.88',unit:'probability',quality:'documented',calibrationState:'current',measurementUncertainty:'',source:'device_import',privacyClass:'local_only',retention:'session',limitation:'Manufacturer documentation does not establish catch-prediction accuracy.',locationIncluded:false },
  blank: { deviceProfileId:'',eventType:'manual_note',recordedAt:'',deviceMaturity:'unknown',capabilityEvidence:'unknown',value:'',unit:'',quality:'unknown',calibrationState:'unknown',measurementUncertainty:'',source:'manual_entry',privacyClass:'local_only',retention:'none',limitation:'',locationIncluded:false }
};

loadFixture('manual');
fixture?.addEventListener('change', () => loadFixture(fixture.value));
form?.addEventListener('reset', () => queueMicrotask(() => { fixture.value='manual'; loadFixture('manual'); hideResult(); }));
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) { status.textContent='Complete the required contract fields. No event was validated.'; return; }
  const data = new FormData(form);
  const valueText = String(data.get('value') || '').trim();
  const uncertaintyText = String(data.get('measurementUncertainty') || '').trim();
  const recordedAt = String(data.get('recordedAt') || '');
  const limitation = String(data.get('limitation') || '').trim();
  const output = validateRigSignalEvent({
    schemaVersion:'1.0.0',eventId:`rig-${Date.now()}`,deviceProfileId:String(data.get('deviceProfileId')||'').trim(),eventType:String(data.get('eventType')||''),recordedAt:recordedAt?`${recordedAt}:00.000Z`:'',deviceMaturity:String(data.get('deviceMaturity')||'unknown'),capabilityEvidence:String(data.get('capabilityEvidence')||'unknown'),value:valueText===''?null:(Number.isFinite(Number(valueText))?Number(valueText):valueText),unit:String(data.get('unit')||'').trim()||null,quality:String(data.get('quality')||''),calibrationState:String(data.get('calibrationState')||''),measurementUncertainty:uncertaintyText===''?null:Number(uncertaintyText),source:String(data.get('source')||''),privacyClass:String(data.get('privacyClass')||''),retention:String(data.get('retention')||'none'),locationIncluded:data.get('locationIncluded')==='on',limitations:limitation?[limitation]:[]
  });
  render(output);
});

function loadFixture(key){const values=fixtures[key]||fixtures.manual;for(const [name,value] of Object.entries(values)){const field=form?.elements[name];if(!field)continue;if(field instanceof RadioNodeList)continue;if(field.type==='checkbox')field.checked=Boolean(value);else field.value=value;}if(status)status.textContent=key==='blank'?'Blank event loaded.':'Example loaded. Change any field or validate it as shown.';}
function hideResult(){if(result){result.hidden=true;result.replaceChildren();}if(empty)empty.hidden=false;}
function render(output){if(!result||!empty||!status)return;empty.hidden=true;result.hidden=false;const tone=output.disposition==='accepted'?'accepted':output.disposition==='review_required'?'review':'rejected';const eventRows=output.event?`<dl class="facts"><div><dt>Event</dt><dd>${esc(output.event.eventType)}</dd></div><div><dt>Device</dt><dd>${esc(output.event.deviceProfileId)}</dd></div><div><dt>Maturity</dt><dd>${esc(output.event.deviceMaturity)}</dd></div><div><dt>Evidence</dt><dd>${esc(output.event.capabilityEvidence)}</dd></div><div><dt>Quality</dt><dd>${esc(output.event.quality)}</dd></div><div><dt>Calibration</dt><dd>${esc(output.event.calibrationState)}</dd></div><div><dt>Uncertainty</dt><dd>${esc(output.event.measurementUncertainty??'not recorded')}</dd></div><div><dt>Retention</dt><dd>${esc(output.event.retention)}</dd></div></dl>`:'';result.innerHTML=`<article class="result-card ${tone}"><p class="badge">${esc(output.disposition.replaceAll('_',' '))}</p><h2>${output.disposition==='accepted'?'Bounded observation accepted.':output.disposition==='review_required'?'Keep this in review.':'Event rejected.'}</h2>${eventRows}<section><h3>Errors</h3>${list(output.errors,'None')}</section><section><h3>Warnings</h3>${list(output.warnings,'None')}</section><section><h3>Limitations</h3>${list(output.limitations,'No event-specific limitation was supplied.')}</section><section><h3>Next action</h3>${list(output.nextActions)}</section><p class="boundary">${esc(output.boundary)}</p><div class="actions"><button type="button" data-download>Download validation record</button><button type="button" class="secondary" data-print>Print</button></div></article>`;status.textContent=`Rig Signal disposition: ${output.disposition.replaceAll('_',' ')}.`;result.focus();result.querySelector('[data-print]')?.addEventListener('click',()=>window.print());result.querySelector('[data-download]')?.addEventListener('click',()=>download(output));}
function download(output){const blob=new Blob([`${JSON.stringify({...output,validatedAt:new Date().toISOString()},null,2)}\n`],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`rig-signal-${output.disposition}-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);}
function list(items,emptyText=''){return items?.length?`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:`<p>${esc(emptyText)}</p>`;}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);}
