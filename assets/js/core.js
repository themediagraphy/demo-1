/* core.js: shared behaviour for every page (theme, header, menus, reveals, helpers). */
(function () {
  'use strict';
  var d = document, h = d.documentElement, CFG = window.MG_CONFIG || {};
  var MG = window.MG = window.MG || {};
  var $ = function (id) { return d.getElementById(id); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  MG.$ = $; MG.$$ = $$;
  MG.reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  MG.fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  MG.TAX = CFG.gstRegistered ? (CFG.gstRate || 18) : 0;
  if (CFG.gstRegistered) h.dataset.gst = 'on';
  /* a page reached by clicking a link always starts at its top (back, forward and reload keep their own position) */
  try { var nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type === 'navigate' && !location.hash && (window.scrollY || h.scrollTop)) window.scrollTo(0, 0); } catch (e) {}

  /* ---------- helpers ---------- */
  MG.esc = function (x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  MG.inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  MG.lk = function (n) { return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + ' L' : '₹' + Math.round(n).toLocaleString('en-IN'); };
  MG.WA = (CFG.whatsapp || '918637744905');
  /* Opening hours are in Indian Standard Time (UTC+5:30), whatever time zone the visitor is in. */
  MG.isOpen = function () {
    var hs = CFG.hours || { days: [1, 2, 3, 4, 5, 6], open: 10, close: 19 }, t = new Date(Date.now() + 19800000);
    return hs.days.indexOf(t.getUTCDay()) >= 0 && t.getUTCHours() >= hs.open && t.getUTCHours() < hs.close;
  };
  MG.wa = function (t) { return 'https://wa.me/' + MG.WA + '?text=' + encodeURIComponent(t); };
  MG.okPh = function (v) { return /^(\+?91)?[6-9]\d{9}$/.test(String(v).replace(/[\s-]/g, '')); };
  MG.mailto = function (t, o) { return 'mailto:' + (CFG.email || 'growth@themediagraphy.in') + '?subject=' + encodeURIComponent('Website lead: ' + t) + '&body=' + encodeURIComponent(Object.keys(o).map(function (k) { return k + ': ' + o[k]; }).join('\n')); };
  MG.tw = function (el, to, fmt, ms) {
    ms = ms || 500; var from = +el.dataset.v || 0; el.dataset.v = to;
    if (MG.reduced) { el.textContent = fmt(to); return; }
    cancelAnimationFrame(el._r); var t0 = performance.now();
    (function f(n) { var p = Math.min((n - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) el._r = requestAnimationFrame(f); })(t0);
  };
  MG.lead = function (type, data) {
    if (!CFG.leadUrl) return Promise.resolve(false);
    var rec = Object.assign({ type: type, time: new Date().toISOString(), page: location.pathname }, data);
    try { return fetch(CFG.leadUrl, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(rec) }).then(function () { return true; }, function () { return false; }); }
    catch (e) { return Promise.resolve(false); }
  };
  MG.save = function (fn, data, btn, label) {
    var rs = function () { setTimeout(function () { btn.textContent = label; }, 2000); };
    try {
      var u = URL.createObjectURL(new Blob([data], { type: 'text/plain;charset=utf-8' })), a = d.createElement('a');
      a.href = u; a.download = fn; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1500); btn.textContent = 'Saved ✓';
    } catch (e) {
      if (navigator.clipboard) { navigator.clipboard.writeText(data).then(function () { btn.textContent = 'Copied ✓'; }, function () { btn.textContent = 'Not available here'; }); }
      else btn.textContent = 'Not available here';
    }
    rs();
  };

  /* open links to folders correctly when the site is previewed from disk (file://) */
  MG.idx = (location.protocol === 'file:' || d.documentElement.hasAttribute('data-idx')) ? 'index.html' : '';
  if (MG.idx) {
    $$('a[href]').forEach(function (a) {
      var u = a.getAttribute('href');
      if (!u || /^(https?:|mailto:|tel:|#)/.test(u)) return;
      var m = u.match(/^([^?#]*)(.*)$/);
      if (m[1] === '' || /\.[a-z0-9]+$/i.test(m[1])) return;
      a.setAttribute('href', (m[1].slice(-1) === '/' ? m[1] : m[1] + '/') + 'index.html' + m[2]);
    });
  }

  /* ---------- theme ----------
     The page is re-coloured by one attribute (data-theme). A View Transition reveals the new theme as a circle growing from the
     button, on phones and desktops alike. Nothing heavy runs before the first frame after the tap: the icon swaps at once and
     the browser captures the old screen straight away. The one big re-colour (the theme attribute together with "no CSS
     transitions") then happens in a single style pass inside the transition. Without View Transitions, or with reduced motion
     on, the theme simply switches at once. */
  var tg = $('theme');
  function curTheme() { return h.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); }
  function label(t) { if (!tg) return; tg.dataset.ti = t; tg.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme'); tg.setAttribute('aria-pressed', t === 'dark'); }
  function persist(t) {
    try { localStorage.setItem('mg-theme', t); } catch (e) {}
    var m = d.querySelector('meta[name="theme-color"]:not([media])');
    if (!m) { m = d.createElement('meta'); m.name = 'theme-color'; d.head.appendChild(m); }
    m.content = t === 'dark' ? '#14110d' : '#f7f2e8';
  }
  /* the colours and the button icon change with this one attribute write; saving the choice can wait a moment */
  function applyTheme(t) { h.dataset.theme = t; label(t); setTimeout(function () { persist(t); }, 0); }
  if (tg) {
    label(curTheme());
    var busy = false;
    tg.addEventListener('click', function () {
      if (busy) return;
      var nx = curTheme() === 'dark' ? 'light' : 'dark';
      if (MG.reduced || !d.startViewTransition) {
        /* no animation: switch at once, with every CSS transition paused for that pass so nothing lags behind */
        h.classList.add('tnr'); applyTheme(nx);
        requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.remove('tnr'); }); });
        return;
      }
      var r = tg.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      /* measure against the largest viewport a phone can show (address bar hidden) so the circle always ends past every corner */
      var W = Math.max(innerWidth, h.clientWidth, (screen && screen.width) || 0), H = Math.max(innerHeight, (screen && screen.height) || 0);
      var rad = Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y))) + 40;
      label(nx);                 /* icon first: it is painted with the very next frame */
      busy = true;
      h.classList.add('tvt');    /* cheap: only names the button and hides the header's own transition layer */
      var end = function () { busy = false; h.classList.remove('tvt'); setTimeout(function () { h.classList.remove('tnr'); }, 40); };
      try {
        var t = d.startViewTransition(function () { h.classList.add('tnr'); applyTheme(nx); });
        t.ready.then(function () {
          h.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards', pseudoElement: '::view-transition-new(root)' });
        }).catch(end);
        t.finished.then(end, end);
      } catch (e) { h.classList.add('tnr'); applyTheme(nx); end(); }
    });
  }

  /* ---------- header, progress, mobile bar ---------- */
  var hdr = $('hdr'), prog = $('prog'), mbar = $('mbar'), fab = d.querySelector('.fab'), tick = false;
  function onScroll() {
    tick = false;
    var y = window.scrollY || h.scrollTop, max = Math.max(1, h.scrollHeight - h.clientHeight);
    if (hdr) hdr.classList.toggle('sc', y > 8);
    if (prog) prog.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
    if (mbar) mbar.classList.toggle('show', y > 420);
    if (fab) fab.classList.toggle('show', y > 520);
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- desktop dropdowns ---------- */
  var dds = $$('.dd');
  function closeDD(except) { dds.forEach(function (dd) { if (dd !== except) { dd.classList.remove('open'); var b = dd.querySelector('.dd__b'); if (b) b.setAttribute('aria-expanded', 'false'); } }); }
  dds.forEach(function (dd) {
    var b = dd.querySelector('.dd__b');
    b.addEventListener('click', function () { var o = !dd.classList.contains('open'); closeDD(dd); dd.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { dd.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.dd')) closeDD(); });

  /* ---------- mobile menu ---------- */
  var mnav = $('mnav'), burger = $('burger'), mclose = $('mclose'), lastF = null;
  function openMenu() {
    lastF = d.activeElement; mnav.classList.add('open'); mnav.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); d.body.classList.add('lock');
    setTimeout(function () { mclose.focus(); }, 30);
  }
  function closeMenu() {
    mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); d.body.classList.remove('lock');
    if (lastF && lastF.focus) lastF.focus();
  }
  if (burger && mnav) {
    burger.addEventListener('click', openMenu); mclose.addEventListener('click', closeMenu);
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) { mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); d.body.classList.remove('lock'); } });
    d.addEventListener('keydown', function (e) {
      if (!mnav.classList.contains('open')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button,summary', mnav).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    matchMedia('(min-width:1081px)').addEventListener('change', function (m) { if (m.matches && mnav.classList.contains('open')) closeMenu(); });
  }

  /* ---------- scroll reveals (children of [data-rv] arrive in a short stagger) ---------- */
  $$('[data-rv]').forEach(function (c) { Array.prototype.forEach.call(c.children, function (el, i) { el.classList.add('rv'); el.style.setProperty('--i', Math.min(i, 8)); }); });
  var rvs = $$('.rv');
  if (!('IntersectionObserver' in window) || MG.reduced) { rvs.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (e) { ro.observe(e); });
  }
  var steps = $('steps');
  if (steps && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { steps.style.setProperty('--p', 1); so.disconnect(); } }, { threshold: .3 });
    so.observe(steps);
  } else if (steps) steps.style.setProperty('--p', 1);

  /* ---------- count-ups ---------- */
  function count(el, to, suf, ms) {
    if (MG.reduced) { el.textContent = to + suf; return; }
    var t0 = performance.now();
    (function f(n) { var p = Math.min((n - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
  }
  var stats = $$('.stat b[data-to]');
  if (stats.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { co.unobserve(e.target); count(e.target, +e.target.dataset.to, e.target.dataset.suf || '', 1300); } }); }, { threshold: .6 });
    stats.forEach(function (s) { s.textContent = '0' + (s.dataset.suf || ''); co.observe(s); });
  }
  var meter = d.querySelector('[data-count]');
  if (meter && !MG.reduced) { var mt = +meter.dataset.count; meter.textContent = '0'; setTimeout(function () { count(meter, mt, '', 1800); }, 1100); }

  /* ---------- FAQ accordion with a smooth height animation ---------- */
  $$('details.faq').forEach(function (det) {
    var sum = det.querySelector('summary'), ans = det.querySelector('.ans');
    if (!ans) return;
    sum.addEventListener('click', function (e) {
      if (MG.reduced || !ans.animate) return;
      e.preventDefault();
      ans.getAnimations().forEach(function (a) { a.cancel(); });
      var opts = { duration: 280, easing: 'cubic-bezier(.22,.8,.24,1)' };
      if (det.open) {
        var hh = ans.offsetHeight; var a = ans.animate({ height: [hh + 'px', '0px'] }, opts);
        a.onfinish = function () { det.open = false; ans.style.height = ''; };
      } else {
        det.open = true; var h2 = ans.offsetHeight; ans.animate({ height: ['0px', h2 + 'px'] }, opts);
      }
    });
  });

  /* ---------- pointer spotlight on service cards (desktop only) ---------- */
  if (MG.fine && !MG.reduced) {
    $$('.svc').forEach(function (c) {
      c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ---------- modal ---------- */
  var modal = $('modal'), mFocus = null;
  MG.modal = function (title, sub, html, after) {
    if (!modal) return;
    $('mod-t').textContent = title; $('mod-s').textContent = sub || ''; $('mod-b').innerHTML = html; $('mod-b').scrollTop = 0;
    mFocus = d.activeElement;
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
    if (after) after(modal);
  };
  MG.closeModal = function () { if (modal && modal.open) { if (modal.close) modal.close(); else modal.removeAttribute('open'); } };
  if (modal) {
    $('mod-x').addEventListener('click', MG.closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) MG.closeModal(); });
    modal.addEventListener('close', function () { if (mFocus && mFocus.focus) mFocus.focus(); });
  }

  /* ---------- segmented controls: a highlight that slides to the chosen option ---------- */
  $$('.seg').forEach(function (sg) {
    var ind = d.createElement('span'); ind.className = 'seg__i'; ind.setAttribute('aria-hidden', 'true'); sg.insertBefore(ind, sg.firstChild);
    function pos(snap) {
      var on = sg.querySelector('[aria-checked="true"],[aria-selected="true"]');
      if (!on || !on.offsetWidth) { sg.classList.remove('si'); return; }
      if (snap) ind.style.transition = 'none';
      ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)'; sg.classList.add('si');
      if (snap) { void ind.offsetWidth; ind.style.transition = ''; }
    }
    pos(true);
    if ('MutationObserver' in window) new MutationObserver(function () { pos(false); }).observe(sg, { attributes: true, subtree: true, attributeFilter: ['aria-checked', 'aria-selected'] });
    addEventListener('resize', function () { pos(true); }, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { pos(true); });
  });

  /* ---------- moving between pages ----------
     With cross-document View Transitions the browser cross-fades the pages (see 50-v2.css). Elsewhere we fade the page out
     on a normal link click; the next page fades in by itself. Every page opens at the top. */
  if (!h.classList.contains('vt') && !MG.reduced) {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault(); h.classList.add('leaving');
      setTimeout(function () { location.href = u.href; }, 170);
    });
    addEventListener('pageshow', function (e) { if (e.persisted) h.classList.remove('leaving'); });
  }

  /* ---------- sideways strips (plans, generic vs local): arrows, dots, counter ---------- */
  (function () {
    var mq = matchMedia('(max-width:760px)'), rm = matchMedia('(prefers-reduced-motion:reduce)');
    document.querySelectorAll('.plans-g,.cmp').forEach(function (st) {
      var kids = Array.prototype.slice.call(st.children); if (kids.length < 2) return;
      var nm = st.classList.contains('cmp') ? 'comparison' : 'plans', c = document.createElement('div'); c.className = 'car';
      c.innerHTML = '<button type="button" aria-label="Previous"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div class="car__d" aria-hidden="true">' + kids.map(function () { return '<i></i>'; }).join('') + '</div><span class="car__n" aria-live="off"></span><button type="button" aria-label="Next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
      st.insertAdjacentElement('afterend', c);
      var pv = c.children[0], nx = c.children[3], dots = c.querySelectorAll('i'), num = c.querySelector('.car__n'), cur = 0, tk = 0;
      st.setAttribute('role', 'region'); st.setAttribute('aria-roledescription', 'carousel'); if (!st.getAttribute('aria-label')) st.setAttribute('aria-label', 'Swipe sideways to see more ' + nm);
      function idx() { var l = st.scrollLeft + st.clientWidth / 2, b = 0, d = 1e9; kids.forEach(function (k, i) { var m = Math.abs(k.offsetLeft - st.offsetLeft + k.offsetWidth / 2 - l); if (m < d) { d = m; b = i; } }); if (st.scrollLeft + st.clientWidth >= st.scrollWidth - 4) b = kids.length - 1; if (st.scrollLeft <= 4) b = 0; return b; }
      function ui() { tk = 0; cur = idx(); dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); }); num.textContent = (cur + 1) + ' / ' + kids.length; pv.disabled = cur === 0; nx.disabled = cur === kids.length - 1; }
      function go(i) { i = Math.max(0, Math.min(kids.length - 1, i)); var k = kids[i]; st.scrollTo({ left: k.offsetLeft - st.offsetLeft - (st.clientWidth - k.offsetWidth) / 2, behavior: rm.matches ? 'auto' : 'smooth' }); }
      pv.onclick = function () { go(cur - 1); }; nx.onclick = function () { go(cur + 1); };
      st.addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(ui); }, { passive: true });
      st.tabIndex = 0;
      st.addEventListener('keydown', function (e) { if (!mq.matches) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
      function sync() { var on = mq.matches; c.classList.toggle('on', on); if (!on) st.removeAttribute('tabindex'); else st.tabIndex = 0; if (on) { ui(); var s = st.querySelector('.plan.pop,.plan.on,.plan--pop'); } }
      (mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync)); addEventListener('resize', ui, { passive: true }); sync();
    });
  })();

})();
