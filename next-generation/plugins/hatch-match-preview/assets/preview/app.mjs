const form = document.querySelector('#hatch-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
let seed = null;
let sourceState = { ready: false, reason: 'Source records are loading.' };

const cueMap = {
  'three-tails': { Mayfly: 3, Stonefly: 1 },
  'two-tails': { Stonefly: 3, Mayfly: 1 },
  'portable-case': { Caddisfly: 4 },
  'surface-winged': { Mayfly: 2, Caddisfly: 1, Stonefly: 1 },
  'rock-crawler': { Stonefly: 2, Mayfly: 1 }
};

initialize();

async function initialize() {
  try {
    const response = await fetch('../../data/seed-records.json', { credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error(`Hatch Match seed records returned ${response.status}.`);
    seed = await response.json();
    sourceState = validateSourceState(seed, new Date());
    if (!sourceState.ready) {
      form?.querySelectorAll('button, input, select').forEach((control) => { control.disabled = true; });
      results.replaceChildren();
      addText(results, 'h2', 'Comparison held for source review.');
      addText(results, 'p', sourceState.reason);
      status.textContent = 'Hatch Match is blocked because its biological reference evidence is stale, expired, unavailable, or missing ownership.';
      return;
    }
    status.textContent = `Reviewed biological reference set ready. Sources were reviewed ${seed.reviewedDate}; review again by ${seed.nextReviewDate}.`;
  } catch (error) {
    sourceState = { ready: false, reason: error instanceof Error ? error.message : 'Hatch Match seed records could not be loaded.' };
    form?.querySelectorAll('button, input, select').forEach((control) => { control.disabled = true; });
    results.replaceChildren();
    addText(results, 'h2', 'Source unavailable.');
    addText(results, 'p', sourceState.reason);
    status.textContent = 'No comparison was run because the reviewed source package is unavailable.';
  }
}

function validateSourceState(data, now) {
  if (!data || data.maintenanceState !== 'active') return { ready: false, reason: 'The maintenance state is not active.' };
  if (!Array.isArray(data.sources) || !data.sources.length) return { ready: false, reason: 'No reviewed biological sources are packaged.' };
  const missingContract = data.sources.filter((source) => !source.sourceOwner || !source.url || !source.reviewedAt || !source.nextReviewAt);
  if (missingContract.length) return { ready: false, reason: 'One or more biological sources lacks an owner, current-check link, reviewed date, or next review date.' };
  const hardExpiry = Date.parse(data.expiresDate || '');
  if (!Number.isFinite(hardExpiry) || now.getTime() > hardExpiry) return { ready: false, reason: `The source package expired ${data.expiresDate || 'without a recorded date'}.` };
  const nextReview = Date.parse(data.nextReviewDate || '');
  if (!Number.isFinite(nextReview) || now.getTime() > nextReview) return { ready: false, reason: `The scheduled source review passed ${data.nextReviewDate || 'without a recorded date'}.` };
  return { ready: true, reason: null };
}

function addText(parent, tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function addList(parent, heading, items) {
  addText(parent, 'h3', heading);
  const list = document.createElement('ul');
  for (const item of items) addText(list, 'li', item);
  parent.append(list);
}

function scoreRecord(record, waterType, lifeStage, cues) {
  let score = 0;
  if (record.waterTypes.includes(waterType)) score += 2;
  if (record.lifeStages.includes(lifeStage)) score += 3;
  for (const cue of cues) score += cueMap[cue]?.[record.commonGroup] || 0;
  return score;
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!seed || !sourceState.ready) {
    status.textContent = 'No comparison was run because the reviewed biological source contract is not current.';
    return;
  }
  const data = new FormData(form);
  const waterType = data.get('waterType');
  const lifeStage = data.get('lifeStage');
  const cues = data.getAll('cue');

  results.replaceChildren();
  if (!cues.length) {
    addText(results, 'p', 'Add at least one visible cue. A life stage by itself is too easy to overread.');
    status.textContent = 'No comparison was run without an observable cue.';
    return;
  }

  const ranked = seed.records
    .map((record) => ({ record, score: scoreRecord(record, waterType, lifeStage, cues) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    addText(results, 'p', 'The reviewed preview set does not support a useful comparison for those clues. Keep the identification unknown.');
    status.textContent = 'No supported preview match.';
    return;
  }

  addText(results, 'h2', 'Broad plausibility candidates—not a current hatch report.');
  addText(results, 'p', seed.readerBoundary);
  for (const { record, score } of ranked.slice(0, 3)) {
    const article = document.createElement('article');
    article.className = 'match';
    addText(article, 'p', `${score} clue-alignment points`, 'score');
    addText(article, 'h3', `${record.commonGroup} plausibility`);
    addText(article, 'p', `${record.order} · ${record.broadRegion}`);
    addList(article, 'What supports the hypothesis', record.observableCues);
    addList(article, 'What could make it wrong', record.disconfirmingCues);
    addList(article, 'Limits that stay attached', record.limitations);
    const sourceNames = record.sourceIds.map((id) => seed.sources.find((source) => source.id === id)?.sourceOwner || id);
    addText(article, 'p', `Evidence: ${record.evidenceState.replaceAll('_', ' ')} · Source owners: ${sourceNames.join('; ')} · Reviewed ${seed.reviewedDate} · Review again by ${seed.nextReviewDate}`, 'limits');
    results.append(article);
  }

  status.textContent = 'Compared locally against reviewed broad-reference records. The output is a plausibility aid only; no exact location, current hatch claim, species certainty, account, observation history, or catch outcome was stored.';
});
