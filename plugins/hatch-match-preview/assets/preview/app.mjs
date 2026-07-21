const response = await fetch('../../data/seed-records.json', { credentials: 'omit' });
if (!response.ok) throw new Error('Hatch Match seed records could not be loaded.');
const seed = await response.json();

const form = document.querySelector('#hatch-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');

const cueMap = {
  'three-tails': { Mayfly: 3, Stonefly: 1 },
  'two-tails': { Stonefly: 3, Mayfly: 1 },
  'portable-case': { Caddisfly: 4 },
  'surface-winged': { Mayfly: 2, Caddisfly: 1, Stonefly: 1 },
  'rock-crawler': { Stonefly: 2, Mayfly: 1 }
};

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

form.addEventListener('submit', (event) => {
  event.preventDefault();
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

  for (const { record, score } of ranked.slice(0, 3)) {
    const article = document.createElement('article');
    article.className = 'match';
    addText(article, 'p', `${score} clue points`, 'score');
    addText(article, 'h2', record.commonGroup);
    addText(article, 'p', `${record.order} · ${record.broadRegion}`);
    addList(article, 'What supports the hypothesis', record.observableCues);
    addList(article, 'What could make it wrong', record.disconfirmingCues);
    addList(article, 'Limits that stay attached', record.limitations);
    addText(article, 'p', `Evidence: ${record.evidenceState.replaceAll('_', ' ')} · Reviewed ${record.reviewedDate || seed.reviewedDate} · Preview state: ${record.publicationState.replaceAll('_', ' ')}`, 'limits');
    results.append(article);
  }

  status.textContent = 'Compared locally against reviewed broad-reference records. No location, account, observation history, or catch outcome was stored.';
});
