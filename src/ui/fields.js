/* =====================================================================
   INPUTS — one renderer per field type. Each returns a DOM node.
   onChange(value) stores the answer; the field redraws itself if needed.
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});
  const { h, toFa, toEn, norm } = ABX.dom;

  function numberField(f, value, onChange) {
    const input = h('input', {
      id: 'f-' + f.id, type: 'text', dir: 'ltr', autocomplete: 'off',
      inputmode: f.step === 'decimal' ? 'decimal' : 'numeric',
      placeholder: '—',
    });
    input.value = value === null || value === undefined ? '' : toFa(value);
    input.addEventListener('input', () => {
      const raw = toEn(input.value).trim();
      if (raw === '') return onChange(null);
      const n = Number(raw);
      onChange(Number.isFinite(n) ? n : null);
    });
    return h('div', { class: 'field field--number' },
      h('label', { for: 'f-' + f.id }, f.label),
      h('div', { class: 'num' }, input, f.unit ? h('span', { class: 'unit', dir: 'auto' }, f.unit) : null));
  }

  function chipsField(f, value, onChange) {
    const wrap = h('div', { class: 'field field--chips', role: 'group', 'aria-label': f.label });
    function draw(current) {
      wrap.replaceChildren(
        h('span', { class: 'field__label' }, f.label),
        h('div', { class: 'chips' }, f.options.map((o) =>
          h('button', {
            type: 'button',
            class: 'chip' + (current === o.v ? ' is-on' : ''),
            'aria-pressed': current === o.v ? 'true' : 'false',
            onclick: () => { const next = current === o.v ? null : o.v; onChange(next); draw(next); },
          }, o.l))));
    }
    draw(value === undefined ? null : value);
    return wrap;
  }

  function searchField(f, value, onChange) {
    const fixedVals = (f.fixed || []).map((x) => x.v);
    let selected = fixedVals.concat((Array.isArray(value) ? value : []).filter((v) => !fixedVals.includes(v)));
    if (fixedVals.length && !(Array.isArray(value) && fixedVals.every((v) => value.includes(v)))) onChange(selected.slice());
    let query = '';
    const input = h('input', { id: 'f-' + f.id, type: 'search', placeholder: f.placeholder || '', autocomplete: 'off' });
    const list = h('div', { class: 'suggest', role: 'listbox' });
    const picked = h('div', { class: 'picked' });

    function commit() { onChange(selected.slice()); draw(); }
    function draw() {
      const q = norm(query);
      const matches = f.options.filter((o) => !selected.includes(o.v) && (!q || norm(o.l).includes(q)));
      list.replaceChildren(...(matches.length
        ? matches.map((o) => h('button', {
            type: 'button', class: 'suggest__item', role: 'option',
            onclick: () => { selected.push(o.v); query = ''; input.value = ''; commit(); input.focus(); },
          }, o.l))
        : [h('p', { class: 'suggest__empty' }, 'موردی پیدا نشد.')]));
      picked.replaceChildren(...selected.map((v) => {
        const o = f.options.find((x) => x.v === v);
        const locked = fixedVals.includes(v);
        return h('button', {
          type: 'button', class: 'chip is-on' + (locked ? '' : ' chip--removable'),
          'aria-label': locked ? o.l : 'حذف ' + o.l,
          onclick: locked ? null : () => { selected = selected.filter((x) => x !== v); commit(); },
        }, o.l, locked ? null : h('span', { class: 'x', 'aria-hidden': 'true' }, '×'));
      }));
    }
    input.addEventListener('input', () => { query = input.value; draw(); });
    draw();
    return h('div', { class: 'field field--search' },
      h('label', { for: 'f-' + f.id, class: 'visually-hidden' }, f.label),
      picked, input, list);
  }

  const renderers = { number: numberField, chips: chipsField, search: searchField };

  ABX.fields = {
    render(f, value, onChange) {
      const r = renderers[f.type];
      if (!r) throw new Error('No renderer for field type: ' + f.type);
      return r(f, value, onChange);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
