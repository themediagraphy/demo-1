/* anim.js: the motion layer. Everything here is decoration. Content is complete without it,
   and nothing animates when the visitor asks for reduced motion. */
(function () {
  'use strict';
  var d = document, red = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var fmt = function (n, f) { return f === 'in' ? Math.round(n).toLocaleString('en-IN') : String(Math.round(n)); };

  function count(el) {
    var to = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', f = el.dataset.fmt;
    if (red) { el.textContent = pre + fmt(to, f) + suf; return; }
    var t0 = performance.now(), ms = 1300;
    (function s(n) { var p = Math.min((n - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + fmt(to * e, f) + suf; if (p < 1) requestAnimationFrame(s); })(t0);
  }
  function arrive(el) {
    el.classList.add('in');
    $$('.bar i[data-w]', el).forEach(function (i) { i.style.width = i.dataset.w + '%'; });
    $$('.r1[data-score]', el).forEach(function (c) { c.style.strokeDashoffset = 327 * (1 - (+c.dataset.score) / 100); });
    $$('[data-to]', el).forEach(function (b) { if (!b.closest('.stat')) count(b); });
  }

  var targets = $$('.sec-head,.phero,.hero,.smp,.rep,.wk,.cal,.plans-g');
  if (!targets.length) return;
  if (!red) {
    /* counters start from zero only once we know the script is running */
    $$('.smp [data-to],.rep [data-to]').forEach(function (b) { b.textContent = (b.dataset.pre || '') + '0' + (b.dataset.suf || ''); });
  }
  if (red || !('IntersectionObserver' in window)) { targets.forEach(arrive); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { arrive(e.target); io.unobserve(e.target); } });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(function (t) {
    if (t.classList.contains('hero') || t.classList.contains('phero')) requestAnimationFrame(function () { arrive(t); });
    else io.observe(t);
  });
  /* printing or saving a page as PDF must never leave content hidden */
  addEventListener('beforeprint', function () { targets.forEach(arrive); });
})();
