/* solid.js: the hero "local growth engine" scene and the small 3D objects beside headings. Decoration only.
   - Nothing runs for prefers-reduced-motion (the HTML/CSS fallback is a set of plain cards).
   - The "Pause motion" switch (class cx-paused on <html>) stops the idle loops.
   - Only transform / opacity / custom properties are animated. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var vh = function () { return w.innerHeight || root.clientHeight; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var paused = function () { return root.classList.contains('cx-paused'); };

  /* ======================================================================================
     2. THE GROWTH ENGINE: a core with the six services circling it, seen from above.
     The links are the real <a> elements from the page; they are billboarded (always face you) and move on an orbit.
     Hover slows it down so a link is easy to click; the pointer swings the camera; Pause motion stops it.
     ====================================================================================== */
  var stage = d.querySelector('.eng__stage');
  if (stage && !stage.querySelector('.eng3d')) (function () {
    var nodes = $$('.eng__n', stage), hub = stage.querySelector('.eng__hub'), n = nodes.length;
    if (!n) return;
    stage.classList.add('eng--3d'); var efr = stage.closest('.eng__frame'); if (efr) efr.classList.add('eng--flat');
    var wrap = d.createElement('div'); wrap.className = 'eng3d';
    var cam2 = d.createElement('div'); cam2.className = 'eng3d__cam'; wrap.appendChild(cam2);
    var i, el;
    var gnd = d.createElement('div'); gnd.className = 'eng3d__gnd'; gnd.setAttribute('aria-hidden', 'true');
    gnd.innerHTML = '<i class="g3"></i><i class="g2"></i><i class="g1"></i><i class="sw"></i><i class="rp"></i>'; cam2.appendChild(gnd);
    var core = d.createElement('div'); core.className = 'eng3d__core'; core.setAttribute('aria-hidden', 'true');
    var discs = ''; for (i = 0; i < 14; i++) discs += '<i style="--k:' + i + '"' + (i === 13 ? ' class="top"' : '') + '></i>';
    core.innerHTML = discs + '<i class="ring"></i>'; cam2.appendChild(core);
    var sparks = []; for (i = 0; i < 9; i++) {
      el = d.createElement('i'); el.className = 'eng3d__sp'; el.setAttribute('aria-hidden', 'true');
      var a = i / 9 * Math.PI * 2 + 0.4; el.style.setProperty('--sx', (Math.cos(a) * 22) + 'px'); el.style.setProperty('--sz', (Math.sin(a) * 22) + 'px'); el.style.setProperty('--d', (-i * 0.38) + 's');
      cam2.appendChild(el); sparks.push(el);
    }
    var tag = d.createElement('div'); tag.className = 'eng3d__tag'; tag.setAttribute('aria-hidden', 'true');
    var hsvg = hub && hub.querySelector('svg'), hb = hub && hub.querySelector('b'), hs = hub && hub.querySelector('span');
    tag.innerHTML = (hsvg ? hsvg.outerHTML : '') + '<b>' + (hb ? hb.textContent : 'Your shop') + '</b><span>' + (hs ? hs.textContent : 'Kalyan East') + '</span>'; cam2.appendChild(tag);
    var beams = [], pks = [];
    nodes.forEach(function () {
      var b = d.createElement('i'); b.className = 'eng3d__beam'; b.setAttribute('aria-hidden', 'true'); cam2.appendChild(b); beams.push(b);
      var p = d.createElement('i'); p.className = 'eng3d__pk'; p.setAttribute('aria-hidden', 'true'); cam2.appendChild(p); pks.push(p);
    });
    nodes.forEach(function (a2) { cam2.appendChild(a2); });
    stage.insertBefore(wrap, stage.firstChild);

    var u = 1, mx = 0, my = 0, tmx = 0, tmy = 0, hovS = false, seen2 = false, raf2 = 0, last2 = 0;
    var tier = [-44, 6, -30, 16, -50, 0], TAU = Math.PI * 2, STEP = TAU / n;
    /* the orbit works in steps: one channel is turned to the front, held for a few seconds so it can be read, then the next comes round */
    var sel = 0, spin = Math.PI / 2, spinT = Math.PI / 2, spinV = 0, holdUntil = 0, nextAt = 3600, lastAdv = 0, selK = nodes.map(function () { return 0; });
    var cap = d.getElementById('engCap'), cx = cap && cap.querySelector('.eng__cx'), cnm2 = d.getElementById('engNm'), ck = d.getElementById('engK'), cdd = d.getElementById('engD'), cgo2 = d.getElementById('engGo'), arr2 = cap ? $$('.eng__ar', cap) : [];
    var pad2 = function (v) { return (v < 10 ? '0' : '') + v; };
    var showCap = function (animate) {
      var nd = nodes[sel]; if (!cap) return;
      cnm2.textContent = nd.getAttribute('data-t') || nd.textContent; cdd.textContent = nd.getAttribute('data-d') || '';
      ck.textContent = pad2(sel + 1) + ' / ' + pad2(n); cgo2.setAttribute('href', nd.getAttribute('href'));
      cgo2.setAttribute('aria-label', 'Open ' + cnm2.textContent);
      if (animate && cx) { cx.classList.remove('sw'); void cx.offsetWidth; cx.classList.add('sw'); }
    };
    var select = function (i, hold) {
      i = ((i % n) + n) % n; var dlt = ((i - sel) % n + n) % n; if (dlt > n / 2) dlt -= n;
      if (dlt) { spinT -= dlt * STEP; sel = i; showCap(true); }
      if (hold) { holdUntil = performance.now() + 9000; if (cx) cx.setAttribute('aria-live', 'polite'); }
      lastAdv = performance.now(); wake2();
    };
    nodes.forEach(function (nd2, k2) { nd2.setAttribute('data-k', k2); });
    if (cap) { cap.hidden = false; cx && cx.setAttribute('aria-live', 'off'); showCap(false); }
    var size = function () { u = stage.clientWidth / 420 || 1; stage.style.setProperty('--u', u.toFixed(4) + 'px'); };
    size(); w.addEventListener('resize', size, { passive: true });
    var frame2 = function (now) {
      raf2 = 0;
      var dt = Math.min(64, Math.max(1, now - (last2 || now))) / 1000; last2 = now;
      var still = paused() ? 0 : 1;
      /* auto-advance, unless the visitor is looking at it, has just used it, or has paused motion */
      var held = hovS || stage.matches(':focus-within') || (cap && cap.matches(':hover,:focus-within')) || now < holdUntil || !still;
      if (held) { nextAt = now + 3400; lastAdv = now; }
      else if (now >= nextAt) { select(sel + 1, false); nextAt = now + 3400; lastAdv = now; }
      if (cap) cap.style.setProperty('--tp', held ? '0' : clamp((now - lastAdv) / 3400, 0, 1).toFixed(3));
      /* a slightly under-damped spring turns the orbit to the chosen channel */
      var sub = Math.max(1, Math.round(dt * 60)), jj; for (jj = 0; jj < sub; jj++) { spinV += ((spinT - spin) * 90 - spinV * 14) / 60; spin += spinV / 60; }
      mx += (tmx - mx) * Math.min(1, dt * 5); my += (tmy - my) * Math.min(1, dt * 5);
      var yaw = mx * 22 + Math.sin(now / 3400) * 4 * still, tilt = -36 + my * 6 + Math.sin(now / 2600) * 1.4 * still;
      cam2.style.transform = 'rotateX(' + tilt.toFixed(2) + 'deg) rotateY(' + yaw.toFixed(2) + 'deg)';
      var bill = ' rotateY(' + (-yaw).toFixed(2) + 'deg) rotateX(' + (-tilt).toFixed(2) + 'deg)';
      var kz = u < 0.95 ? 1.45 : 1, R = (u < 0.95 ? 138 : 152) * u, Rz = 146 * u * kz, core0 = -14 * u, k;
      for (k = 0; k < n; k++) {
        var th = spin + k * STEP, x = Math.cos(th) * R, z = Math.sin(th) * Rz, y = (z / Rz * 16 - 16 + Math.sin(now / 900 * still + k * 1.7) * 2.5 * still) * u;
        selK[k] += ((k === sel ? 1 : 0) - selK[k]) * Math.min(1, dt * 7);
        var depth = 0.9 + 0.2 * ((z / Rz + 1) / 2), sc = depth * (1 + (u < 0.95 ? 0.05 : 0.12) * selK[k]);
        nodes[k].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px)' + bill + ' scale(' + sc.toFixed(3) + ') translate(-50%,-50%)';
        nodes[k].style.zIndex = String(Math.round(10 + z / Rz * 10 + selK[k] * 5));
        nodes[k].classList.toggle('is-sel', k === sel); if (k === sel) nodes[k].setAttribute('aria-current', 'true'); else nodes[k].removeAttribute('aria-current');
        var vx = x, vy = y - core0, vz = z, len = Math.hypot(vx, vy, vz) || 1;
        beams[k].style.width = len.toFixed(1) + 'px'; beams[k].classList.toggle('is-sel', k === sel);
        beams[k].style.transform = 'translate3d(0,' + core0.toFixed(1) + 'px,0) rotateY(' + Math.atan2(-vz, vx).toFixed(4) + 'rad) rotateZ(' + Math.asin(clamp(vy / len, -1, 1)).toFixed(4) + 'rad)';
        var f = ((now * 0.00042 * (still || 0.3)) + k * 0.19) % 1, e2 = 1 - f; e2 = 1 - e2 * e2;
        var qq = 1 - (0.42 + 0.33 * e2), sf = Math.sin(Math.PI * f); /* the little packets travel the middle of each beam only, so they never sit on a label's words */
        pks[k].style.transform = 'translate3d(' + (x * qq).toFixed(1) + 'px,' + (core0 + vy * qq).toFixed(1) + 'px,' + (z * qq).toFixed(1) + 'px)' + bill + ' scale(' + (0.55 + 0.45 * sf).toFixed(2) + ')'; pks[k].style.opacity = (Math.pow(sf, 0.7) * clamp((0.75 - z / Rz) * 3.5, 0, 1)).toFixed(2);
      }
      /* the "Your shop" tag is solved backwards from the screen: it must land on the hub's top disc whatever the camera does, yet stay nearer the viewer than the packets and sparks.
         Pick the on-screen point (the hub), slide the tag toward the viewer along that line of sight, then undo tilt and yaw to get its scene position. */
      var TR = tilt * Math.PI / 180, YR = yaw * Math.PI / 180, cT = Math.cos(TR), sT = Math.sin(TR), pp = 900 * u, oy = -0.1 * (stage.clientHeight || 312 * u);
      var hy = -15.2 * u * cT, hz = -15.2 * u * sT, sy = oy + (hy - oy) * pp / (pp - hz), tz = 120 * u, ty = oy + (sy - oy) * (pp - tz) / pp;
      var gy = ty * cT + tz * sT, gz = -ty * sT + tz * cT;
      tag.style.transform = 'translate(-50%,-50%) translate3d(' + (-gz * Math.sin(YR)).toFixed(1) + 'px,' + gy.toFixed(1) + 'px,' + (gz * Math.cos(YR)).toFixed(1) + 'px)' + bill;
      sparks.forEach(function (sp) { sp.style.transform = ''; });
      if (seen2) raf2 = requestAnimationFrame(frame2);
    };
    var wake2 = function () { if (!raf2) { last2 = 0; raf2 = requestAnimationFrame(frame2); } };
    if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { seen2 = es[0].isIntersecting; if (seen2) wake2(); }, { rootMargin: '60px' }).observe(stage);
    else { seen2 = true; wake2(); }
    stage.addEventListener('pointerenter', function (e) { if (!e.pointerType || e.pointerType === 'mouse') hovS = true; });
    stage.addEventListener('pointerleave', function () { hovS = false; tmx = tmy = 0; });
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var b = stage.getBoundingClientRect(); tmx = clamp((e.clientX - (b.left + b.width / 2)) / (b.width / 2), -1, 1); tmy = clamp((e.clientY - (b.top + b.height / 2)) / (b.height / 2), -1, 1);
    }, { passive: true });
    /* a label that is not in front turns to the front first; the one in front is an ordinary link */
    nodes.forEach(function (a3) {
      a3.addEventListener('click', function (e) { var kx = +a3.getAttribute('data-k'); if (kx !== sel) { e.preventDefault(); select(kx, true); } else holdUntil = performance.now() + 9000; });
      a3.addEventListener('focus', function () { var kx = +a3.getAttribute('data-k'); if (kx !== sel) select(kx, true); });
    });
    arr2.forEach(function (bt) { bt.addEventListener('click', function () { select(sel + (+bt.getAttribute('data-d')), true); }); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(sel + 1, true); var nx = nodes[sel]; nx && nx.focus({ preventScroll: true }); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(sel - 1, true); var pv = nodes[sel]; pv && pv.focus({ preventScroll: true }); }
    });
    wake2();
  })();

  /* ======================================================================================
     3. SMALL 3D OBJECTS beside section headings (wide screens only). They tumble only while on screen
     and drift against the scroll at their own depth.
     ====================================================================================== */
  if (matchMedia('(min-width:1000px)').matches && d.getElementById('reach')) (function () {
    var HTML = {
      gyro: '<i></i><i></i><i></i><u></u>',
      coin: (function () { var h = '', q; for (q = 0; q < 9; q++) h += '<i style="--k:' + q + '"' + (q === 8 ? ' class="top"' : q === 0 ? ' class="bot"' : '') + '></i>'; return h; })(),
      stack: '<i></i><i></i><i></i>'
    };
    /* [section id, kind, size px, top px, right %, depth] */
    var PLAN = [['flow', 'coin', 70, 56, 4, 0.10], ['tools', 'gyro', 84, 60, 5, 0.14], ['services', 'stack', 84, 58, 6, 0.08], ['industries', 'coin', 62, 64, 6, 0.16],
      ['how', 'gyro', 76, 60, 7, 0.1], ['work', 'stack', 80, 60, 5, 0.12], ['learn', 'gyro', 58, 64, 8, 0.15], ['pricing', 'coin', 78, 56, 4, 0.12], ['faq', 'gyro', 70, 60, 6, 0.13], ['contact', 'stack', 66, 54, 6, 0.1]];
    var items = [];
    PLAN.forEach(function (p) {
      var sec = d.getElementById(p[0]); if (!sec) return;
      var el = d.createElement('div'); el.className = 'd3 d3--' + p[1]; el.setAttribute('aria-hidden', 'true');
      el.style.setProperty('--d', p[2] + 'px'); el.style.top = p[3] + 'px'; el.style.right = p[4] + '%';
      el.innerHTML = '<div class="d3__o">' + HTML[p[1]] + '</div>'; sec.classList.add('has-d3'); sec.insertBefore(el, sec.firstChild);
      items.push({ el: el, sec: sec, k: p[5], on: false });
    });
    var ticking = false;
    var upd = function () {
      ticking = false; var H = vh();
      items.forEach(function (it) {
        if (!it.on) return;
        var r = it.sec.getBoundingClientRect(), mid = r.top + 60 - H / 2; it.el.style.setProperty('--py', clamp(-mid * it.k, -60, 60).toFixed(1) + 'px');
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { items.forEach(function (it) { if (it.sec === e.target) { it.on = e.isIntersecting; it.el.classList.toggle('d3--on', it.on); } }); });
        onScroll();
      }, { rootMargin: '80px' });
      items.forEach(function (it) { io.observe(it.sec); });
      w.addEventListener('scroll', onScroll, { passive: true });
    }
  })();
})();
