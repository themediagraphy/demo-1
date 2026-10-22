/* palette.js: a search-and-jump palette (Ctrl K, Cmd K or "/"). Works on every page, no libraries. */
(function () {
  'use strict';
  var MG = window.MG, d = document, D = window.MG_DATA || {}, root = d.body.dataset.root || '', I = MG.idx || '';
  var u = function (p, h) { return root + p + (p ? I : '') + (h || ''); };
  var ico = function (n) {
    var P = {
      page: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>', tool: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', pin: '<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
      tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.2"/>', act: '<path d="M5 12h14M13 6l6 6-6 6"/>', wa: '<path d="M12 3.5a8.5 8.5 0 00-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1012 3.5z"/>',
      phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>', moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.page) + '</svg>';
  };
  var items = [
    ['Home', 'Page', '', 'page', function () { return u(''); }, 'start main'],
    ['Pricing and plans', 'Page', '', 'tag', function () { return u('pricing/'); }, 'price cost fee plan monthly'],
    ['Free audit', 'Free tool', '', 'tool', function () { return u('tools/', '#audit'); }, 'score checklist report'],
    ['Lead estimator', 'Free tool', '', 'tool', function () { return u('tools/', '#estimate'); }, 'budget roi enquiries break-even'],
    ['Book a chai and strategy meet', 'Free tool', '', 'tool', function () { return u('tools/', '#meet'); }, 'appointment call slot calendar'],
    ['Founders', 'Page', '', 'page', function () { return u('founders/'); }, 'team cards ayush prakhar nikhil'],
    ['Contact us', 'Page', '', 'page', function () { return u('contact/'); }, 'whatsapp call email form callback'],
    ['FAQ', 'Page', '', 'page', function () { return u('faq/'); }, 'questions gst commission contract results'],
    ['Services', 'Page', '', 'page', function () { return u('services/'); }, 'all services'],
    ['Areas we serve', 'Page', '', 'pin', function () { return u('areas/'); }, 'kalyan dombivli thane']
  ];
  (D.SV || []).forEach(function (s) { items.push([s.name, 'Service', '', 'tag', function () { return u('services/' + s.slug + '/'); }, 'service']); });
  (D.AREAS || []).forEach(function (a) { items.push([a.name, 'Area', '', 'pin', function () { return u('areas/' + a.slug + '/'); }, 'area near location']); });
  (D.PLANS || []).forEach(function (p) { items.push([p.n + ' plan', 'Plan', MG.inr(p.f) + ' a month', 'tag', function () { return u('pricing/', '#plans'); }, 'plan price ' + p.slug + ' ' + p['for']]); });
  items.push(['Privacy policy', 'Page', '', 'page', function () { return u('privacy/'); }, 'data legal']);
  items.push(['Terms and refunds', 'Page', '', 'page', function () { return u('terms/'); }, 'legal refund']);
  items.push(['Service agreement', 'Page', '', 'page', function () { return u('agreement/'); }, 'contract legal']);
  items.push(['Message us on WhatsApp', 'Action', '', 'wa', function () { return MG.wa('Namaste Mediagraphy!'); }, 'chat whatsapp message', true]);
  items.push(['Call ' + (window.MG_CONFIG && MG_CONFIG.phone || ''), 'Action', '', 'phone', function () { return 'tel:+' + MG.WA; }, 'phone call dial']);
  items.push(['Switch light or dark theme', 'Action', '', 'moon', function () { var t = d.getElementById('theme'); if (t) t.click(); return null; }, 'theme dark light mode night']);
  var TOP = [0, 2, 1, 4, 6, 1 + 1];
  var dlg, inp, list, sel = 0, shown = [], lastF = null;

  function build() {
    dlg = d.createElement('dialog'); dlg.className = 'pal'; dlg.id = 'pal'; dlg.setAttribute('aria-label', 'Search and jump');
    dlg.innerHTML = '<div class="pal__in"><span class="pal__i" aria-hidden="true">' + ico('act') + '</span><input id="pal-q" type="text" role="combobox" aria-expanded="true" aria-controls="pal-l" aria-autocomplete="list" placeholder="Search pages, plans, areas, tools…" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>' +
      '<ul class="pal__l" id="pal-l" role="listbox" aria-label="Results"></ul><p class="pal__f"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span class="pal__hint">Tip: press <kbd>Ctrl</kbd> <kbd>K</kbd> anywhere</span></p>';
    d.body.appendChild(dlg); inp = d.getElementById('pal-q'); list = d.getElementById('pal-l');
    inp.addEventListener('input', function () { sel = 0; render(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) go(shown[+li.dataset.i]); });
    list.addEventListener('pointermove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; mark(); } });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { if (lastF && lastF.focus) lastF.focus(); });
  }
  function render(q) {
    q = (q || '').toLowerCase().trim();
    var toks = q.split(/\s+/).filter(Boolean);
    shown = q ? items.filter(function (it) { var hay = (it[0] + ' ' + it[1] + ' ' + it[2] + ' ' + it[5]).toLowerCase(); return toks.every(function (t) { return hay.indexOf(t) >= 0; }); })
      : [0, 2, 3, 4, 1, 5, 6].map(function (i) { return items[i]; }).concat(items.filter(function (it) { return it[1] === 'Action'; }));
    shown = shown.slice(0, 9);
    list.innerHTML = shown.length ? shown.map(function (it, i) {
      return '<li role="option" id="pal-o' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span class="pal__ic">' + ico(it[3]) + '</span><span class="pal__t"><b>' + MG.esc(it[0]) + '</b>' + (it[2] ? '<small>' + MG.esc(it[2]) + '</small>' : '') + '</span><em>' + it[1] + '</em></li>';
    }).join('') : '<li class="pal__none">Nothing matches &ldquo;' + MG.esc(q) + '&rdquo;. Try &ldquo;price&rdquo;, &ldquo;gym&rdquo; or &ldquo;WhatsApp&rdquo;.</li>';
    mark();
  }
  function mark() {
    var lis = list.querySelectorAll('li[data-i]');
    Array.prototype.forEach.call(lis, function (li, i) { li.setAttribute('aria-selected', i === sel); if (i === sel) { inp.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } });
  }
  function move(n) { if (!shown.length) return; sel = (sel + n + shown.length) % shown.length; mark(); }
  function go(it) {
    if (!it) return;
    var href = it[4]();
    close();
    if (href === null) return;
    if (it[6]) { window.open(href, '_blank', 'noopener'); return; }
    if (href.indexOf('tel:') === 0) { location.href = href; return; }
    location.href = href;
  }
  function open() {
    if (!dlg) build();
    lastF = d.activeElement; sel = 0; inp.value = ''; render('');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(function () { inp.focus(); }, 20);
  }
  function close() { if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }
  MG.palette = { open: open, close: close };
  ['srch', 'srch2'].forEach(function (id) { var b = d.getElementById(id); if (b) b.addEventListener('click', function () { if (id === 'srch2') { var m = d.getElementById('mnav'); if (m && m.classList.contains('open')) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); d.body.classList.remove('lock'); var bg = d.getElementById('burger'); if (bg) bg.setAttribute('aria-expanded', 'false'); } } open(); }); });
  d.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dlg && dlg.open ? close() : open(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) { e.preventDefault(); open(); }
  });
})();
