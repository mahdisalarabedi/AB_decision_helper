# HANDOFF — Antibiotic decision helper (MPH thesis)

Read this whole file before replying. It replaces a long previous chat.
The user (Mahdi, GP in Iran) will also upload the project folder and the WHO AWaRe PDF.

---

## 0. First thing to do in the new chat

1. **Audit the uploaded code against this document.** The user edits files by hand, so his copy is the source of truth, not any earlier version. Report mismatches before adding anything.
2. Run the engine tests if possible (`node tests/engine.test.js`, expected 18/18).
3. Then ask which condition to build next, and follow the workflow in §2.

Reply in **English**, concise and structured, even when the user writes in Persian.

---

## 1. The project in one paragraph

An MPH thesis: design and evaluate a digital decision-support tool that helps **newly graduated Iranian GPs** decide whether to prescribe an antibiotic in outpatient practice. The problem is antibiotic overprescription by GPs in Iran. The core argument: chatbots give information but tend to reinforce the doctor's prior (sycophancy, automation bias); this tool instead aims to **change the decision**, using structured, guideline-based questioning. All clinical content comes from the **WHO AWaRe antibiotic book (2022)**. The decision engine is **deterministic, with no AI at runtime**.

### Evaluation design (agreed, for the thesis)
- Approved proposal: single-group pre-test/post-test. No control group.
- Agreed refinement: **one session**, sequential "unaided → tool" design, with case-level counterbalancing of tool order (chatbot vs app) if both are used.
- **Two-stage capture per case**: initial intention (diagnosis, antibiotic yes/no, agent, confidence) before any resource, then final decision. Outcomes: wrong→right (corrective), right→wrong (harm), wrong→wrong (failure to influence), plus confidence change.
- Resource use (chatbot/guideline/none) is **measured per case, not mandated**; participants paste chatbot transcripts for qualitative coding.
- Parallel case forms were dropped (unnecessary in a single session); randomize case order instead.
- Cases written from AWaRe; beware **circularity** (app and reference standard both AWaRe). Primary outcome = the binary prescribe/don't decision. Secondary outcome = % Access-group agents.
- Participants are friends of the user; mitigate demand effects (blinded scoring, hypothesis not disclosed).
- Not yet built: logger, intent capture. These come later.

---

## 2. Working agreement (very important)

- **Claude never rebuilds the project and never sends zip files.** The user maintains the project on his own computer (`C:\Users\Asus\Desktop\source\`).
- Every change is delivered as a numbered **change note**:
  1. File path
  2. **Find this** (exact text)
  3. **Replace with** (exact text)
  4. **What it changes** in the app
  5. **How to check**
- New files may be given as a downloadable single file (that is not a zip). Always include the `<script>` line to add in `index.html` (before `src/app.js`) and the entry for `build.py`.
- **Workflow for a new condition:**
  1. Read the AWaRe chapter.
  2. Present the rules **in plain terms** (tables, page numbers). No code yet.
  3. List the **gaps** where AWaRe is silent. The user decides; these become "expert decisions".
  4. Only after agreement, write the code as a change note.
- **Go step by step. Short replies.** No walls of text. One question at a time.
- Rule verification is done by **the user and his supervisor (an infectious disease specialist)**. Every rule carries `src: { page, type }`, where type is `'guideline'` or `'expert'` (expert = pending sign-off).
- Before giving a change, test it yourself in a reference copy (tests plus a browser click-through). Do not claim it works untested.

---

## 3. How to run the app

- Double-click **`index.html`** in the project folder. Edit a file, save, and press **Ctrl+Shift+R** (a hard reload; plain F5 sometimes keeps a cached old script).
- `index.template.html` is only a mold for `build.py`. Never open it directly.
- `build.py` (optional, needs Python) makes one shareable file in `dist/`.
- Debugging: press F12 → Console, then read the red error line and the `file:line` it gives.

---

## 4. Architecture — the "hut"

| Part | File | Job |
|---|---|---|
| Foundation | `content/cough.js`, `content/sore-throat.js` | All clinical content as data. Edit these to change clinical behaviour. |
| Walls | `src/engine.js` | Deterministic engine. Answers in → result + trace out. No clinical knowledge. |
| Helpers | `src/ui/dom.js` | Element builder `h()`, Persian digits, citation badge `cite()` |
| Inputs | `src/ui/fields.js` | `number`, `chips` (single select, tap again to clear), `search` (type-to-search multi-select) |
| Door | `src/ui/entry.js` | "چرا به تجویز آنتی‌بیوتیک فکر می‌کنید؟" with a trigger button grid |
| Rooms | `src/ui/wizard.js` | Stepper pages, progress bar, back/next, skip ("انجام نشده"), red-flag interrupt |
| Review | `src/ui/review.js` | All entries on one screen, tap to edit, then "نمایش نتیجه" |
| Windows | `src/ui/results.js` | Verdict, red flags, missing items, trap refutation, score, Rx block, sections, decision trace (مسیر تصمیم) |
| Frame | `src/app.js` | State + router |
| Paint | `styles/main.css` | Persian RTL, mobile-first, light/dark tokens, font Vazirmatn |
| Tests | `tests/engine.test.js` | Answers → expected outcome, each run twice (determinism check) |

**Load order in `index.html`:** content files → `engine.js` → `dom.js` → `fields.js` → `entry.js` → `wizard.js` → `review.js` → `results.js` → `app.js` (last).

The trigger list (`ABX.triggers`) currently lives at the top of `content/cough.js`. Active: سرفه, گلودرد. Inactive ("به‌زودی"): آبریزش طولانی بینی, سوزش ادرار, گوش‌درد, اسهال. The user wants eventually **all AWaRe conditions and more symptoms**, not just these.

UI language: Persian, with drug names in English.

---

## 5. Content schema (one flow = one object in `ABX.flows.<id>`)

```
id, title
setting            (optional; e.g. sore throat: { rfRisk: 'high' })
pages[]            { id, title, hint?, skippable?, skipLabel?, checkRedFlagsOnLeave?, fields[] }
  field            { id, type: 'number'|'chips'|'search', label, unit?, step?, options?[{v,l}], placeholder? }
redFlags[]         { id, label, when, src }    any single flag → outcome 'refer' (interrupt)
redFlagRule        { src }
findings[]         (optional) { id, label, record, fixPage, when, src, informativeOnly? }
scores{}           (optional) { label, items[{label, record, fixPage, when, needs}], bands[{id,min,max,text}], src }
rules[]            { id, outcome, when, src }   evaluated top to bottom, FIRST MATCH WINS; last rule must be a catch-all
traps[]            { id, title, text, when, showFor[outcomeIds], src }   misleading triggers refuted on the result screen
outcomes{}         { tone: calm|indicated|caution|alert|neutral, verdict, summary, summarySrc?,
                     diagnosis?, diagnosisSrc?   (optional substitute-diagnosis line)
                     showScore?, showTraps?, showMissing?, rx?, sections[{title, items[{rx?, t, src}]}] }
```

**Condition language:**
- Leaf: `{ field, op, value, unknownIf? }`, where op is one of `> >= < <= == in includes`.
- Composites: `all`, `any`, `none`, `{ always: true }`.
- Rule-only leaves: `{ finding: 'D1', is: true|false|null }` and `{ score: 'centor', band: 'high' }`.

⚠️ **Technical names are case-sensitive and must match exactly everywhere**: rule ids, outcome keys, `showFor` entries, field ids, band ids. (A capitalized `No_Antibiotic` caused a long debugging session.) Persian display text can be changed freely.

---

## 6. Engine semantics

- **Tri-state findings:** true / false / null (unknown). An empty field = unknown, **never assumed normal**. `includes` (search lists): not selected = absent.
- **Red-flag interrupt:** checked when leaving a page with `checkRedFlagsOnLeave` and again at evaluation. Any one flag → `refer`.
- **Scores with missing items have a range** (min = points present; max = min + unknown items). A band is assigned only if min and max fall in the same band. Otherwise the result is undecided, and the rules route to `incomplete`, which lists exactly the items to record.
- Result object: `{ outcomeId, ruleId, answers, findings, scores, redFlags, traps, missing, score, trace }`.
- The decision trace on screen shows each finding and score item as ✓ / ✗ / ؟, and which rule fired.
- Every flow has a guaranteed **`no_antibiotic`** ending ("آنتی‌بیوتیک لازم نیست — درمان حمایتی کافی است"). A substitute diagnosis is an optional `diagnosis:` line, used only when the guideline offers one.
- Recommended (given to the user, may or may not be applied): a guard after `const outcome = flow.outcomes[outcomeId];` that throws a clear error naming the rule and the missing outcome.

---

## 7. Built so far

### 7a. Cough — adults ≥ 18 (`content/cough.js`) — AWaRe bronchitis pp. 29–35, CAP pp. 149–158
- **Pages:** شرح حال و سیر (age, duration, course, sputum) → علائم همراه (search) → علائم حیاتی و معاینه (T, HR, RR, SBP, DBP, SpO₂, confusion, chest auscultation) → آزمایش (CRP, WBC; skippable) → تصویربرداری (CXR; skippable).
- **Red flags:** confusion; RR > 30; SBP < 90 or DBP ≤ 60 (CRB-65, p. 157); SpO₂ < 92% (expert).
- **Findings:** D1 T ≥ 38; D2 HR > 90 (expert, borrowed from the sepsis box p. 297); D3 RR ≥ 20 (expert, p. 297); D4 dyspnoea; D5 focal chest signs (focal crackles / bronchial; "not examined" = unknown); X1 CXR infiltrate (informative only).
- **Rules (in order):** RULE_AGE → not_adult; RULE_CHRONIC (≥ 21 days) → chronic; RULE_CXR → pneumonia; RULE_PNEUMONIA (D5 + ≥ 1 of D1–D4) → pneumonia; RULE_NO_ANTIBIOTIC (D1–D5 all false) → no_antibiotic (diagnosis line: acute bronchitis); RULE_INCOMPLETE (none true, some unknown) → incomplete; RULE_UNCERTAIN (always) → uncertain.
- **Traps:** yellow/green sputum; diffuse wheeze/rhonchi; low-grade fever 37.3–37.9; cough ≥ 5 days; CRP/WBC done.
- **Pneumonia outcome:** CRB-65 shown (range if items missing); Rx 5 days: amoxicillin 1 g q8h or phenoxymethylpenicillin 500 mg q6h; second choice amoxicillin-clavulanate 875/125 q8h or doxycycline 100 q12h (p. 150); adverse effects listed (expert text).
- **Test vignette:** 24 y/o, 6 days cough, yellow sputum, T 37.6, HR 88, BP 120/78, SpO₂ 97, diffuse wheeze/rhonchi, **no RR given** → `incomplete`. With RR 16 → `no_antibiotic`.

### 7b. Sore throat — adults ≥ 18 (`content/sore-throat.js`) — AWaRe pharyngitis pp. 46–58
- **Team decision: Iran = HIGH rheumatic-fever risk** (`setting.rfRisk: 'high'`).
- **Pages:** شرح حال (age, duration, cough yes/no) → علائم همراه (search: rhinorrhea, hoarseness, …) → معاینه (T, tender anterior cervical nodes, tonsillar exudate, alarm findings search) → تست سریع یا کشت (skippable). There is no imaging page.
- **Centor (p. 53):** fever **> 38.0** (score-table definition, chosen by the user); no cough; tender anterior cervical nodes; exudate. Bands: low 0–2, high 3–4.
- **Red flags (expert, from general clinical knowledge, accepted by the user):** trismus; drooling or can't swallow saliva; uvular deviation or unilateral tonsil swelling; stridor or respiratory distress; neck swelling or stiffness.
- **Rules:** RULE_AGE; RULE_TEST_NEG → no_antibiotic (expert); RULE_TEST_POS → antibiotic_indicated; RULE_CENTOR_LOW → no_antibiotic; RULE_CENTOR_HIGH → antibiotic_indicated (because of the high RF setting); RULE_INCOMPLETE (always; reached when the Centor range spans both bands).
- **Traps:** throat redness (expert); viral symptoms; "antibiotic gives faster relief" (~1 day); preventing suppurative complications; blood tests.
- **`antibiotic_indicated` deliberately shows NO agent/dose/duration yet** (the user asked to stop there). AWaRe p. 58 for later: amoxicillin 500 mg q8h or phenoxymethylpenicillin 500 mg q6h; allergy: cefalexin 500 mg q8h or clarithromycin 500 mg q12h; 10 days in high RF risk (cefalexin/clarithromycin 5 days).

---

## 8. Change log

| # | Change | Status |
|---|---|---|
| 1 | Ending renamed `bronchitis` → `no_antibiotic`; generic "no antibiotic" verdict + optional `diagnosis` line (cough.js, results.js, main.css, tests) | Applied |
| — | Added `index.html` (no-build dev page); `build.py` output moved to `dist/` | Applied |
| 2 | Sore throat added. Engine upgrade: score ranges, `{score, band}` conditions, optional `findings`, `itemState`, `answers` in result. results.js: score range display + trace handles scores. cough.js: CRB-65 band ids, sore-throat trigger activated. | Applied |
| 3 | "Return to result after fixing a missing item" (button relabelling) | **Rejected by the user — do not use.** The user prefers pressing بعدی through to review. Some harmless unused lines (`fixAnswer`, `backToResult` in app.js) may exist; check during the audit. |
| — | Offered: a content checker on page load (rule→outcome, showFor, field ids) | Not yet answered |

**Lessons from debugging:**
- Stale cached scripts → always use Ctrl+Shift+R.
- Case-sensitive ids → a mismatch makes no rule/outcome match.
- Diagnose with Console commands before guessing (e.g. `Object.keys(ABX.flows.cough.outcomes)`, `ABX.flows.cough.rules.map(r => r.id + ' → ' + r.outcome)`, `ABX.engine.computeFindings(flow, ABX.app.state.answers)`).

---

## 9. Open items and backlog

**Expert decisions pending supervisor sign-off:**
- Cough: SpO₂ < 92; single red flag triggers; pneumonia = focal + ≥ 1 systemic; HR/RR thresholds from p. 297; chronic ≥ 21 days; safety-net criteria; 48–72 h review; adverse-effect text.
- Sore throat: red-flag list; negative rapid test ends the question; age ≥ 21 lowers RF risk (not implemented); personal RF/RHD history (not asked; matters for 10- vs 5-day duration).

**Backlog:**
- Antibiotic recommendations for sore throat.
- Content checker.
- Move `ABX.triggers` into its own file.
- Logger + stage-1 intent capture (thesis data).
- Children (all flows are adults only).
- Optional AI "translator" for free text (maps input to structured items, doctor confirms; never decides).
- Grouping missing items by page.
- A verification sheet for the supervisor: Rule ID | plain rule | page | source text | guideline/expert | verified by | status.

**Candidate next conditions** (from the AWaRe primary-care chapters): acute sinusitis (ch. 7, duration threshold); lower UTI (ch. 23, usually yes → agent choice); acute infectious diarrhoea (ch. 14, usually no); acute otitis media (ch. 5). The user wants to continue with **conditions that need antibiotics**, aiming eventually to cover the whole guideline.
