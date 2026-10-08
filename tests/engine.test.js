/* Run: node tests/engine.test.js
   Each case = answers in → expected outcome out. No browser needed. */
require('../content/cough.js');
require('../src/engine.js');
const { engine, flows } = globalThis.ABX;
const flow = flows.cough;

// Case 1 vignette (24 y/o, 6 days cough, yellow sputum, diffuse wheeze) — RR not given
const vignette = {
  age: 24, duration_days: 6, course: 'stable', sputum: 'yellow_green',
  symptoms: ['wheeze_felt'],
  temp: 37.6, hr: 88, sbp: 120, dbp: 78, spo2: 97, confusion: 'no', chest: 'diffuse_wheeze',
};

const cases = [
  ['Vignette as written (RR missing)', vignette, 'incomplete'],
  ['Vignette + RR 16', { ...vignette, rr: 16 }, 'no_antibiotic'],
  ['Vignette + RR 16 + focal crackles + fever', { ...vignette, rr: 16, chest: 'focal_crackles', temp: 38.4 }, 'pneumonia'],
  ['Focal crackles, all vitals normal', { ...vignette, rr: 16, chest: 'focal_crackles' }, 'uncertain'],
  ['Red flag: SpO2 89', { ...vignette, rr: 16, spo2: 89 }, 'refer'],
  ['Red flag: RR 32', { ...vignette, rr: 32 }, 'refer'],
  ['CXR infiltrate', { ...vignette, rr: 16, cxr: 'new_infiltrate' }, 'pneumonia'],
  ['Cough 25 days', { ...vignette, rr: 16, duration_days: 25 }, 'chronic'],
  ['Age 16', { ...vignette, rr: 16, age: 16 }, 'not_adult'],
];

let pass = 0;
cases.forEach(([name, answers, expected]) => {
  const r1 = engine.evaluate(flow, answers);
  const r2 = engine.evaluate(flow, answers); // determinism check
  const ok = r1.outcomeId === expected && JSON.stringify(r1) === JSON.stringify(r2);
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  →  ${r1.outcomeId} (rule ${r1.ruleId})` +
    (r1.traps.length ? `  traps: ${r1.traps.map((t) => t.id).join(',')}` : '') +
    (r1.missing.length ? `  missing: ${r1.missing.map((m) => m.id).join(',')}` : ''));
});
console.log(`\n${pass}/${cases.length} passed`);
process.exit(pass === cases.length ? 0 : 1);
