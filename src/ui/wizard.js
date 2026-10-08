/* =====================================================================
   ROOMS — the stepper: one data page at a time
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h, toFa } = ABX.dom;

  function progress(flow, index) {
    const n = flow.pages.length;
    return h('div', { class: 'progress', 'aria-label': `مرحله ${toFa(index + 1)} از ${toFa(n)}` },
      h('div', { class: 'progress__bar' }, flow.pages.map((p, i) =>
        h('span', { class: 'progress__seg' + (i < index ? ' is-done' : i === index ? ' is-now' : '') }))),
      h('span', { class: 'progress__text' }, `${toFa(index + 1)} از ${toFa(n)}`));
  }

  ABX.ui = ABX.ui || {};
  ABX.ui.wizard = function renderWizard(app) {
    const { flow, pageIndex, answers } = app.state;
    const page = flow.pages[pageIndex];
    const isLast = pageIndex === flow.pages.length - 1;

    function next() {
      if (page.checkRedFlagsOnLeave && ABX.engine.checkRedFlags(flow, answers).length) {
        return app.showResult(); // red-flag interrupt
      }
      app.unskip(page.id);
      if (isLast) app.go('review');
      else app.goPage(pageIndex + 1);
    }

    return h('section', { class: 'screen screen--page' },
      progress(flow, pageIndex),
      h('h2', { class: 'page__title' }, page.title),
      page.hint ? h('p', { class: 'page__hint' }, page.hint) : null,
      page.skippable
        ? h('button', { type: 'button', class: 'skip', onclick: () => app.skipPage(page.id) }, page.skipLabel)
        : null,
      h('div', { class: 'fields' }, page.fields.map((f) =>
        ABX.fields.render(f, answers[f.id], (v) => app.setAnswer(f.id, v)))),
      h('nav', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => (pageIndex === 0 ? app.go('entry') : app.goPage(pageIndex - 1)) }, 'قبلی'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: next }, isLast ? 'مرور اطلاعات' : 'بعدی')));
  };
})(typeof window !== 'undefined' ? window : globalThis);
