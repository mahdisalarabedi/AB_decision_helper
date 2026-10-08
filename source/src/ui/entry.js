/* =====================================================================
   DOOR — entry screen: "Why are you considering an antibiotic?"
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h } = ABX.dom;

  ABX.ui = ABX.ui || {};
  ABX.ui.entry = function renderEntry(app) {
    return h('section', { class: 'screen screen--entry' },
      h('h1', { class: 'entry__q' }, 'چرا به تجویز آنتی‌بیوتیک فکر می‌کنید؟'),
      h('p', { class: 'entry__sub' }, 'شکایت اصلی بیمار را انتخاب کنید.'),
      h('div', { class: 'triggers' }, ABX.triggers.map((t) =>
        h('button', {
          type: 'button',
          class: 'trigger' + (t.active ? '' : ' is-soon'),
          disabled: !t.active,
          onclick: () => app.startFlow(t.id),
        }, h('span', { class: 'trigger__label' }, t.label),
           t.active ? null : h('span', { class: 'trigger__soon' }, 'به‌زودی')))));
  };
})(typeof window !== 'undefined' ? window : globalThis);
