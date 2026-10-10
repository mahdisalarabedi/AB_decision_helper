/* =====================================================================
   WINDOWS — the result screen
   Reads the engine result + outcome content. No decisions made here.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h, toFa, cite } = ABX.dom;

  const mark = { true: '✓', false: '✗', null: '؟' };
  const markLabel = { true: 'دارد', false: 'ندارد', null: 'نامعلوم' };

  function block(title, ...content) {
    return h('section', { class: 'rblock' }, h('h3', { class: 'rblock__title' }, title), ...content);
  }

  // Weight-banded or age-restricted items (children's doses). Other items pass through unchanged.
  function dosed(it, answers) {
    return it.bands || it.notForAge ? ABX.engine.doseFor(it, answers) : null;
  }
  function rxLine(it, answers) {
    const d = dosed(it, answers);
    return d ? [it.rx, d.dose, d.freq].filter(Boolean).join(' ') : it.rx;
  }
  function doseWarn(it, answers) {
    const d = dosed(it, answers);
    return d && d.warn ? ' — ' + d.warn : '';
  }

  function items(list, answers) {
    return h('ul', { class: 'items' }, list.map((it) => h('li', {},
      it.rx ? h('span', { class: 'items__rx', dir: 'ltr' }, rxLine(it, answers)) : null,
      h('span', {}, it.t + doseWarn(it, answers)), cite(it.src))));
  }

  function drugLine(d, answers) {
    const x = ABX.engine.doseFor(d, answers);
    return x.warn ? ` ${d.route} — ${x.warn}` : ` ${x.dose} ${d.route} ${x.freq}`;
  }

  function rxBlock(rx, answers) {
    return block(rx.title,
      rx.groups.map((g) => h('div', { class: 'rx__group' },
        h('span', { class: 'rx__label' }, g.label),
        g.drugs.map((d, i) => h('div', { class: 'rx__drug', dir: 'ltr' },
          h('strong', {}, d.name), drugLine(d, answers),
          h('span', { class: 'aware aware--' + d.aware.toLowerCase() }, d.aware),
          i < g.drugs.length - 1 ? h('span', { class: 'rx__or', dir: 'rtl' }, 'یا') : null)))),
      cite(rx.src),
      rx.adverse ? h('div', { class: 'adverse' },
        h('span', { class: 'rx__label' }, 'عوارض مهم'),
        rx.adverse.items.map((a) => h('div', { class: 'adverse__row' },
          h('strong', { dir: 'ltr' }, a.name),
          h('p', {}, 'شایع: ' + a.common),
          h('p', { class: 'serious' }, 'جدی: ' + a.serious))),
        cite(rx.adverse.src)) : null);
  }

  function trace(flow, r) {
    return h('details', { class: 'trace' },
      h('summary', {}, 'مسیر تصمیم'),
      h('p', { class: 'trace__note' }, 'همین ورودی همیشه همین نتیجه را می‌دهد. یافته‌ها و قانون‌هایی که موتور بررسی کرد:'),
      (flow.findings || []).length ? h('table', { class: 'trace__table' },
        h('tbody', {}, flow.findings.map((f) => {
          const v = r.findings[f.id];
          return h('tr', {},
            h('td', { class: 'trace__id', dir: 'ltr' }, f.id),
            h('td', {}, f.label),
            h('td', { class: 'trace__v trace__v--' + String(v) }, mark[v], ' ', markLabel[v]));
        }))) : null,
      Object.entries(flow.scores || {}).length ? h('table', { class: 'trace__table' },
        h('tbody', {}, Object.entries(flow.scores).flatMap(([key, sc]) =>
          sc.items.map((it) => {
            const v = ABX.engine.itemState(it, r.answers);
            return h('tr', {},
              h('td', { class: 'trace__id', dir: 'ltr' }, sc.label),
              h('td', {}, it.label),
              h('td', { class: 'trace__v trace__v--' + String(v) }, mark[v], ' ', markLabel[v]));
          })))) : null,
      h('ol', { class: 'trace__rules', dir: 'ltr' }, r.trace.map((t) =>
        h('li', { class: t.matched ? 'is-hit' : '' }, t.id, t.matched ? '  ← matched' : ''))));
  }

  ABX.ui = ABX.ui || {};
  ABX.ui.results = function renderResult(app) {
    const { flow, result: r } = app.state;
    const o = flow.outcomes[r.outcomeId];

    return h('section', { class: 'screen screen--result' },
      h('div', { class: 'verdict verdict--' + o.tone },
        h('h2', { class: 'verdict__text' }, o.verdict),
        h('p', { class: 'verdict__summary' }, o.summary, ' ', cite(o.summarySrc)),
        o.diagnosis ? h('p', { class: 'verdict__dx' }, o.diagnosis, ' ', cite(o.diagnosisSrc)) : null),

      r.redFlags.length ? block('یافته‌های هشدار',
        h('ul', { class: 'items items--alert' }, r.redFlags.map((f) => h('li', {}, h('span', {}, f.label), cite(f.src)))),
        cite(flow.redFlagRule.src)) : null,

      o.showMissing && r.missing.length ? block('ثبت کنید',
        h('div', { class: 'missing' }, r.missing.map((m) => h('button', {
          type: 'button', class: 'missing__item',
          onclick: () => app.goPage(flow.pages.findIndex((p) => p.id === m.fixPage)),
        }, m.record, h('span', { class: 'missing__go' }, 'ثبت'))))) : null,

      r.traps.length ? block('چرا این یافته‌ها دلیل آنتی‌بیوتیک نیستند',
        r.traps.map((t) => h('article', { class: 'trap' },
          h('h4', { class: 'trap__title' }, t.title),
          h('p', {}, t.text),
          cite(t.src)))) : null,

      r.score ? block('شدت: ' + r.score.label,
        h('p', { class: 'score' },
          h('span', { class: 'score__n' }, r.score.decided ? toFa(r.score.value) : toFa(r.score.min) + '–' + toFa(r.score.max)),
          h('span', {}, r.score.decided ? r.score.band : 'برای تعیین قطعی، موارد ثبت‌نشده لازم است.')),
        r.score.unknown.length ? h('p', { class: 'score__warn' }, 'ثبت نشده: ' + r.score.unknown.join('، ')) : null,
        cite(r.score.src)) : null,

      o.rx ? rxBlock(o.rx, r.answers) : null,

      o.sections.map((s) => block(s.title, items(s.items, r.answers))),

      trace(flow, r),

      h('nav', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => app.go('review') }, 'ویرایش اطلاعات'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => app.reset() }, 'بیمار جدید')));
  };
})(typeof window !== 'undefined' ? window : globalThis);
