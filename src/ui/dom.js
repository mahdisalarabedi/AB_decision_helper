/* =====================================================================
   UI HELPERS — tiny DOM builder + Persian digit handling
   ===================================================================== */
(function (root) {
  const ABX = (root.ABX = root.ABX || {});

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    children.flat(Infinity).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }

  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const toFa = (s) => String(s).replace(/\d/g, (d) => FA[d]);
  const toEn = (s) => String(s)
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => AR.indexOf(d))
    .replace(/[٫,]/g, '.');

  // Normalise Arabic/Persian letter variants for search
  const norm = (s) => String(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ').trim();

  function cite(src) {
    if (!src) return null;
    const expert = src.type === 'expert';
    const text = expert
      ? 'تصمیم کارشناسی — در انتظار تأیید'
      : 'AWaRe ص ' + toFa(src.page).replace(/,/g, '،');
    return h('span', { class: 'cite' + (expert ? ' cite--expert' : ''), title: src.note || '' }, text);
  }

  ABX.dom = { h, toFa, toEn, norm, cite };
})(typeof window !== 'undefined' ? window : globalThis);
