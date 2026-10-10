/* =====================================================================
   WALLS — the engine
   Pure functions. No clinical knowledge, no DOM, no AI.
   Same answers in → same result out, every time.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});

  const isEmpty = (v) => v === undefined || v === null || v === '';

  // ---- Tri-state leaf: true / false / null (unknown) ----
  function leafTri(c, answers) {
    const v = answers[c.field];
    if (c.op === 'includes') {
      // Lists (symptoms): not selected = absent, never unknown.
      return Array.isArray(v) ? v.includes(c.value) : false;
    }
    if (isEmpty(v)) return null;
    if (c.unknownIf && c.unknownIf.includes(v)) return null;
    switch (c.op) {
      case '>':  return Number(v) > c.value;
      case '>=': return Number(v) >= c.value;
      case '<':  return Number(v) < c.value;
      case '<=': return Number(v) <= c.value;
      case '==': return v === c.value;
      case 'in': return c.value.includes(v);
      default: throw new Error('Unknown operator: ' + c.op);
    }
  }

  // ---- Tri-state composite (for findings) ----
  function tri(cond, answers) {
    if (cond.all) {
      const r = cond.all.map((c) => tri(c, answers));
      if (r.includes(false)) return false;
      if (r.includes(null)) return null;
      return true;
    }
    if (cond.any) {
      const r = cond.any.map((c) => tri(c, answers));
      if (r.includes(true)) return true;
      if (r.includes(null)) return null;
      return false;
    }
    return leafTri(cond, answers);
  }

  // ---- Two-valued evaluator (for rules, red flags, traps) ----
  function bool(cond, ctx) {
    if (cond.always) return true;
    if (cond.all) return cond.all.every((c) => bool(c, ctx));
    if (cond.any) return cond.any.some((c) => bool(c, ctx));
    if (cond.none) return !cond.none.some((c) => bool(c, ctx));
    if (cond.finding) return ctx.findings[cond.finding] === cond.is;
    if (cond.score) {
      const sc = ctx.scores[cond.score];
      if (!sc) throw new Error('Unknown score: ' + cond.score);
      if (cond.decided === false) return !sc.decided;
      return sc.decided && sc.bandId === cond.band;
    }
    if (cond.field) return tri(cond, ctx.answers) === true;
    throw new Error('Unreadable condition: ' + JSON.stringify(cond));
  }

  function computeFindings(flow, answers) {
    const out = {};
    (flow.findings || []).forEach((f) => { out[f.id] = tri(f.when, answers); });
    return out;
  }

  function computeScores(flow, answers) {
    const out = {};
    Object.entries(flow.scores || {}).forEach(([k, sc]) => { out[k] = computeScore(sc, answers); });
    return out;
  }

  function checkRedFlags(flow, answers) {
    const ctx = { answers, findings: computeFindings(flow, answers), scores: computeScores(flow, answers) };
    return (flow.redFlags || []).filter((rf) => bool(rf.when, ctx));
  }

  // A score with unmeasured items has a range, not a value.
  // We only call a band when the lowest and highest possible score agree.
  function computeScore(score, answers) {
    const ctx = { answers, findings: {} };
    let min = 0;
    const unknown = [];
    score.items.forEach((it) => {
      if (bool(it.when, ctx)) min += 1;
      else if (isEmpty(answers[it.needs])) unknown.push(it);
    });
    const max = min + unknown.length;
    const bandOf = (n) => score.bands.find((b) => n >= b.min && n <= b.max) || null;
    const lo = bandOf(min);
    const hi = bandOf(max);
    const decided = !!lo && !!hi && lo === hi;
    return {
      label: score.label, value: min, min, max, decided,
      bandId: decided ? lo.id : null,
      band: decided ? lo.text : '',
      unknown: unknown.map((it) => it.label),
      missing: unknown.filter((it) => it.record).map((it) => ({ record: it.record, fixPage: it.fixPage })),
      src: score.src,
    };
  }

  // ---- Main entry: answers → result, with a full trace ----
  function evaluate(flow, answers) {
    const findings = computeFindings(flow, answers);
    const scores = computeScores(flow, answers);
    const ctx = { answers, findings, scores };
    const trace = [];

    const redFlags = (flow.redFlags || []).filter((rf) => bool(rf.when, ctx));
    let outcomeId = null;
    let ruleId = null;

    if (redFlags.length) {
      outcomeId = 'refer';
      ruleId = 'GATE0_RED_FLAG';
      trace.push({ id: 'GATE0_RED_FLAG', matched: true });
    } else {
      trace.push({ id: 'GATE0_RED_FLAG', matched: false });
      for (const rule of flow.rules) {
        const matched = bool(rule.when, ctx);
        trace.push({ id: rule.id, matched, src: rule.src });
        if (matched) { outcomeId = rule.outcome; ruleId = rule.id; break; }
      }
    }

    const outcome = flow.outcomes[outcomeId];
    const traps = outcome.showTraps
      ? flow.traps.filter((t) => t.showFor.includes(outcomeId) && bool(t.when, ctx))
      : [];
    const missing = outcome.showMissing
      ? [
          ...(flow.findings || []).filter((f) => !f.informativeOnly && findings[f.id] === null),
          ...Object.values(scores).flatMap((sc) => sc.missing),
        ]
      : [];
    const score = outcome.showScore ? scores[outcome.showScore] : null;

    return { outcomeId, ruleId, answers, findings, scores, redFlags, traps, missing, score, trace };
  }

  // ---- Dose for one drug or item, chosen by weight band (children) ----
  // band = { min, max, dose, freq }: min <= kg < max; max null = open-ended.
  // Never guesses: no weight, a weight outside the printed bands, or a
  // blocked age group each return a warning instead of a dose.
  function doseFor(item, answers) {
    if (item.notForAge && item.notForAge.includes(answers.age_group)) {
      return { dose: null, freq: null, warn: 'در این گروه سنی نباید استفاده شود' };
    }
    if (!item.bands) return { dose: item.dose, freq: item.freq, warn: null };
    const w = Number(answers.weight_kg);
    if (isEmpty(answers.weight_kg) || !Number.isFinite(w) || w <= 0) {
      return { dose: null, freq: null, warn: 'وزن ثبت نشده' };
    }
    const b = item.bands.find((x) => w >= x.min && (x.max === null || x.max === undefined || w < x.max));
    return b
      ? { dose: b.dose, freq: b.freq, warn: null }
      : { dose: null, freq: null, warn: 'وزن خارج از جدول AWaRe' };
  }

  // Tri-state of a single score item, for the decision trace
  function itemState(item, answers) {
    if (bool(item.when, { answers, findings: {}, scores: {} })) return true;
    return isEmpty(answers[item.needs]) ? null : false;
  }

  ABX.engine = { evaluate, checkRedFlags, computeFindings, computeScores, itemState, doseFor };
})(typeof window !== 'undefined' ? window : globalThis);