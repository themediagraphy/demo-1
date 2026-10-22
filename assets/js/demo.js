/* demo.js: the hero rail map and the animated four-step enquiry flow. All data is sample data and is labelled as such on the page. */
(function () {
  'use strict';
  var MG = window.MG, $$ = MG.$$, d = document;
  var S = [
    { q: 'dentist, Dombivli', n: 'Your clinic', c: 'Dental clinic · Open until 8 PM', a: ['Dombivli East', 'Kalyan East', 'Dombivli West'], f: 'Appointment request', m: 31, m1: 'Hi, do you do teeth cleaning? Any slot today?', m2: 'Yes we do. A 6 PM slot is free today. Shall I book it?', ok: 'Booked: 6 PM today' },
    { q: 'gym in Kalyan East', n: 'Your gym', c: 'Gym · Open until 10 PM', a: ['Kalyan East', 'Kolsewadi', 'Chinchpada'], f: 'Trial pass request', m: 34, m1: 'Hi, what are the monthly plans? Can I try one day?', m2: 'Sure. Come in tomorrow at 7 AM for a free trial day.', ok: 'Trial booked: 7 AM tomorrow' },
    { q: 'jeweller Ulhasnagar', n: 'Your jewellers', c: 'Jewellery store · Open until 9 PM', a: ['Ulhasnagar 3', 'Ulhasnagar 4', 'Ambernath'], f: 'Showroom visit request', m: 19, m1: 'Hi, do you have light gold chains for gifting?', m2: 'Yes, many designs. Visit this evening or I can send photos now.', ok: 'Visit planned: 7 PM today' },
    { q: 'classes in Titwala', n: 'Your classes', c: 'Coaching centre · Admissions open', a: ['Titwala', 'Titwala', 'Kalyan East'], f: 'Lead form: demo class', m: 41, m1: 'Hi, is there a demo class for 9th standard this week?', m2: 'Yes. Saturday 5 PM. Please share the student name and school.', ok: 'Demo class: Saturday 5 PM' },
    { q: 'salon near Kalyan', n: 'Your salon', c: 'Beauty salon · Open until 9 PM', a: ['Kalyan East', 'Kalyan West', 'Dombivli'], f: 'Booking request', m: 30, m1: 'Hi, are you open today? Need a haircut at 6.', m2: 'Yes, open till 9 PM. 6 PM works. See you then!', ok: 'Booked: 6 PM today' }
  ];
  var tm = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); tm.push(t); return t; }
  function clear() { tm.forEach(clearTimeout); tm = []; }

  /* ---- hero rail map: hovering a station lights its area chip (and the other way round); the moving dots stop for reduced motion ---- */
  var rail = d.getElementById('rail');
  if (rail) {
    var chips = $$('.rail__chip[data-s]'), stns = $$('a.stn', rail);
    var mark = function (slug, on) {
      chips.forEach(function (c) { if (c.dataset.s === slug) c.classList.toggle('hl', on); });
      stns.forEach(function (s) { if (s.dataset.s === slug) s.classList.toggle('hl', on); });
    };
    stns.concat(chips).forEach(function (el) {
      var slug = el.dataset.s;
      ['mouseenter', 'focus'].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, true); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, false); }); });
    });
    if (MG.reduced && rail.pauseAnimations) rail.pauseAnimations();
    /* pause the dots while the map is off screen (saves battery on phones) */
    if ('IntersectionObserver' in window && rail.pauseAnimations) new IntersectionObserver(function (es) { es.forEach(function (e) { if (MG.reduced) return; if (e.isIntersecting) rail.unpauseAnimations(); else rail.pauseAnimations(); }); }).observe(rail);
  }

  /* ---- four-step flow ---- */
  var fl = d.getElementById('flowdemo');
  if (fl && !MG.reduced) {
    var lis = $$('.flow__s li', fl), fvs = $$('.fv', fl), F = function (k) { return fl.querySelector('[data-f="' + k + '"]'); };
    var ft = [], fi = 0, frun = false;
    var fl_later = function (fn, ms) { ft.push(setTimeout(fn, ms)); };
    var fclear = function () { ft.forEach(clearTimeout); ft = []; };
    var show = function (n) {
      lis.forEach(function (li, j) { li.classList.toggle('on', j === n); li.classList.toggle('done', j < n); });
      fvs.forEach(function (v) { if (+v.dataset.s <= n) v.classList.add('in'); });
    };
    var cycle = function () {
      var s = S[(fi++ + 4) % S.length];
      fl.classList.add('run'); fvs.forEach(function (v) { v.classList.remove('in'); });
      lis.forEach(function (li) { li.classList.remove('on', 'done'); });
      F('n').textContent = s.n; F('c').textContent = s.c; F('m1').textContent = s.m1; F('m2').textContent = s.m2; F('ok').textContent = s.ok;
      F('q').textContent = ''; show(0);
      var k = 0, q = s.q; (function t() { k++; F('q').textContent = q.slice(0, k); if (k < q.length) fl_later(t, 60); })();
      fl_later(function () { show(1); }, 1700 + q.length * 40);
      fl_later(function () { show(2); }, 3700 + q.length * 40);
      fl_later(function () { show(3); }, 5700 + q.length * 40);
      fl_later(cycle, 9800 + q.length * 40);
    };
    var fstop = function () { frun = false; fclear(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (!frun) { frun = true; cycle(); } } else fstop(); }); }, { threshold: .3 }).observe(fl);
    }
    d.addEventListener('visibilitychange', function () { if (d.hidden) fstop(); });
  }
})();
