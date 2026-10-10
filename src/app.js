/* =====================================================================
   FRAME — state + router. Connects the parts; contains no clinical logic.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h } = ABX.dom;

  const fresh = () => ({ screen: 'entry', flow: null, pageIndex: 0, answers: {}, skipped: new Set(), result: null });

  const app = {
    state: fresh(),
    root: null,

    render() {
      const view = {
        entry: ABX.ui.entry,
        page: ABX.ui.wizard,
        review: ABX.ui.review,
        result: ABX.ui.results,
      }[app.state.screen];
      app.root.replaceChildren(view(app));
      window.scrollTo(0, 0);
      const heading = app.root.querySelector('h1, h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    },

    go(screen) { app.state.screen = screen; app.render(); },
    goPage(i) { app.state.pageIndex = i; app.go('page'); },

    startFlow(id) {
      app.state = fresh();
      app.state.flow = ABX.flows[id];
      app.goPage(0);
    },

    setAnswer(id, value) {
      if (value === null || value === undefined) delete app.state.answers[id];
      else app.state.answers[id] = value;
    },

    skipPage(pageId) {
      const page = app.state.flow.pages.find((p) => p.id === pageId);
      page.fields.forEach((f) => app.setAnswer(f.id, null));
      app.state.skipped.add(pageId);
      const i = app.state.flow.pages.indexOf(page);
      if (i === app.state.flow.pages.length - 1) app.go('review');
      else app.goPage(i + 1);
    },
    unskip(pageId) { app.state.skipped.delete(pageId); },

    showResult() {
      app.state.result = ABX.engine.evaluate(app.state.flow, app.state.answers);
      app.go('result');
    },

    reset() { app.state = fresh(); app.render(); },
  };

  function mount() {
    document.getElementById('banner').replaceChildren(
      h('span', {}, "نسخه آزمایشی — محتوا هنوز تأیید نشده"),
      h('span', { class: 'banner__src', dir: 'ltr' }, ABX.meta.guideline));
    app.root = document.getElementById('app');
    app.render();
  }

  ABX.app = app;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window);
