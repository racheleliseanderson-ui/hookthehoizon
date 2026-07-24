const STORAGE_KEY = 'hth-first-hour-adjustment-v1';
const form = document.querySelector('#adjustment-form');
const result = document.querySelector('#result');
const reset = document.querySelector('#reset');

const rules = {
  no_contact: {
    none: ['depth', 'Move through a different depth band before changing the whole setup.', 'Contact, follows, forage movement, bottom contact, or a repeatable change in line behavior.'],
    fish_present: ['speed', 'Keep the profile recognizable and change cadence or pause length first.', 'A fish closes distance, commits, follows longer, or rejects at a different point.'],
    wrong_zone: ['depth', 'Correct zone control before judging the lure or fly.', 'The presentation holds the intended band for several repeatable passes.'],
    contact_without_control: ['connection', 'Stabilize the terminal system before changing presentation.', 'Cleaner contact, improved hook penetration, or fewer unexplained failures.']
  },
  follows_no_commit: {
    none: ['profile', 'Reduce or alter profile before making a large color or gear change.', 'A shorter follow becomes a longer inspection, turn, strike, or refusal you can actually read.'],
    fish_present: ['speed', 'Change speed, pause, or direction at the point of refusal.', 'The fish changes posture, closes distance, or commits instead of peeling away.'],
    wrong_zone: ['angle', 'Change the angle so the presentation crosses the fish differently.', 'The presentation remains visible or controlled through the decision zone.'],
    contact_without_control: ['connection', 'Fix the connection system before interpreting another refusal.', 'The next contact transfers cleanly through line, leader, rod, and hook.']
  },
  poor_control: {
    none: ['angle', 'Choose an angle that gives you a readable drift or retrieve.', 'You can describe where the presentation traveled instead of guessing.'],
    fish_present: ['depth', 'Hold the intended zone before changing pattern or color.', 'The setup reaches and stays in the observed fish zone.'],
    wrong_zone: ['depth', 'Change weight, sink rate, float, or line management first.', 'Three repeatable passes hold the target band without constant rescue.'],
    contact_without_control: ['connection', 'Remove slack, drag, or terminal weakness before changing the offering.', 'Contact becomes distinct enough to identify and repeat.']
  },
  missed_connections: {
    none: ['connection', 'Inspect hook point, knot, leader, drag, and line tension before changing the offering.', 'The next contact produces a firmer load or a clear reason for failure.'],
    fish_present: ['speed', 'Adjust cadence or pause to change how the fish meets the hook.', 'Takes become less tentative or occur with better line tension.'],
    wrong_zone: ['depth', 'Stabilize depth so contact happens from a repeatable position.', 'Strikes occur in the same zone and can be compared.'],
    contact_without_control: ['connection', 'Change one connection variable only: hook, knot, drag, leader, or slack.', 'A specific connection change improves or disproves the diagnosis.']
  }
};

function chosen(name) {
  return form.elements[name]?.value || '';
}

function available() {
  return [...form.querySelectorAll('input[name="available"]:checked')].map((input) => input.value);
}

function render(plan) {
  result.className = 'result';
  result.innerHTML = `
    <p class="eyebrow">Change one thing</p>
    <h2>${plan.variableLabel}</h2>
    <p>${plan.action}</p>
    <h3>Evidence that would matter</h3>
    <p>${plan.evidence}</p>
    <h3>Test boundary</h3>
    <p>Give the change a short, repeatable trial. Keep location, weather, and the rest of the setup as stable as practical. If the evidence does not change, reject the hypothesis and move to the next available variable.</p>
    <button type="button" id="print-plan">Print field card</button>
  `;
  document.querySelector('#print-plan').addEventListener('click', () => window.print());
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const problem = chosen('problem');
  const evidence = chosen('evidence');
  const ownedOptions = available();
  if (!problem || !evidence) return;

  const [preferred, action, evidenceTest] = rules[problem][evidence];
  const variable = ownedOptions.includes(preferred) ? preferred : ownedOptions[0];
  if (!variable) {
    result.className = 'result error';
    result.textContent = 'Select at least one variable you can change with what you already have.';
    return;
  }

  const labels = {
    depth: 'Depth or weight',
    speed: 'Speed or cadence',
    angle: 'Angle or path',
    profile: 'Size or profile',
    connection: 'Connection and control'
  };
  const plan = {
    problem,
    evidenceState: evidence,
    variable,
    variableLabel: labels[variable],
    action: variable === preferred ? action : `The preferred test is ${labels[preferred].toLowerCase()}, but it is not available. Test ${labels[variable].toLowerCase()} while keeping the other variables stable.`,
    evidence: evidenceTest,
    createdAt: new Date().toISOString(),
    privacy: { classification: 'local_only', preciseLocationCollected: false }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  render(plan);
});

reset.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  result.className = 'result empty';
  result.textContent = 'Local record cleared. Choose the strongest observable evidence to build another test.';
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved?.variableLabel) render(saved);
} catch {
  localStorage.removeItem(STORAGE_KEY);
}
