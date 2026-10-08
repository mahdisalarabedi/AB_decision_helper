# Antibiotic decision helper — prototype v0.1 (cough, adults)

Content: WHO AWaRe antibiotic book (2022). **Not validated** — pending sign-off by the team.

## The hut

| Part | File | Job | Edit when… |
|---|---|---|---|
| Foundation | `content/cough.js` | All clinical content: pages, red flags, findings, rules, traps, outcomes. Data only. | the guideline or a team decision changes |
| Walls | `src/engine.js` | Deterministic engine. Answers in → result + trace out. No clinical knowledge. | the *kind* of logic changes (new operator etc.) |
| Helpers | `src/ui/dom.js` | Element builder, Persian digits, citation badge | rarely |
| Inputs | `src/ui/fields.js` | Number field, chips, type-to-search | a new input type is needed |
| Door | `src/ui/entry.js` | "Why are you considering an antibiotic?" | adding triggers is done in content |
| Rooms | `src/ui/wizard.js` | Stepper pages, progress, skip, red-flag interrupt | page behaviour changes |
| Review | `src/ui/review.js` | All entries, tap to edit | |
| Windows | `src/ui/results.js` | Verdict, trap refutation, Rx, decision trace | result layout changes |
| Frame | `src/app.js` | State + router | a new screen is added |
| Paint | `styles/main.css` | Look, RTL, mobile | |
| — | `tests/engine.test.js` | Runs cases through the engine (`node tests/engine.test.js`) | every rule change |
| — | `build.py` | Stitches all parts into one HTML page (`python3 build.py`) | a new file is added |

## Open gaps (expert decisions, pending supervisor)
- Gap 1 — SpO₂ red-flag threshold: < 92%
- Gap 2 — any single red flag triggers referral (stricter than CRB-65 ≥ 2)
- Gap 3 — pneumonia = focal chest sign + ≥ 1 of fever / HR > 90 / RR ≥ 20 / dyspnoea
- HR > 90, RR ≥ 20 borrowed from AWaRe sepsis box (p. 297)
- Chronic cough cut-off ≥ 21 days; safety-net return criteria; 48-h review; adverse-effect text
