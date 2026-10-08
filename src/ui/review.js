/* =====================================================================
   REVIEW — everything entered, one screen, tap a section to edit
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h, toFa } = ABX.dom;

  function formatValue(f, v) {
    if (v === null || v === undefined || (Array.isArray(v) && !v.length)) {
      return f.type === 'search' ? 'هیچ‌کدام' : null;
    }
    if (f.type === 'number') return toFa(v) + (f.unit ? ' ' + f.unit : '');
    if (f.type === 'chips') return (f.options.find((o) => o.v === v) || {}).l;
    if (f.type === 'search') return v.map((x) => (f.options.find((o) => o.v === x) || {}).l).join('، ');
    return String(v);
  }

  ABX.ui = ABX.ui || {};
  ABX.ui.review = function renderReview(app) {
    const { flow, answers, skipped } = app.state;
    return h('section', { class: 'screen screen--review' },
      h('h2', { class: 'page__title' }, 'مرور اطلاعات'),
      h('p', { class: 'page__hint' }, 'برای ویرایش، روی هر بخش بزنید.'),
      h('div', { class: 'review' }, flow.pages.map((p, i) =>
        h('button', { type: 'button', class: 'review__block', onclick: () => app.goPage(i) },
          h('span', { class: 'review__title' }, p.title),
          skipped.has(p.id)
            ? h('span', { class: 'review__empty' }, 'انجام نشده')
            : h('dl', { class: 'review__list' }, p.fields.map((f) => {
                const val = formatValue(f, answers[f.id]);
                return [h('dt', {}, f.label), h('dd', { class: val ? '' : 'is-missing' }, val || 'ثبت نشده')];
              }))))),
      h('nav', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => app.goPage(flow.pages.length - 1) }, 'قبلی'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => app.showResult() }, 'نمایش نتیجه')));
  };
})(typeof window !== 'undefined' ? window : globalThis);
