/* solid.js: the 3D service cube and the "local growth engine" scene. Decoration only.
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
  var RAD = Math.PI / 180;
  var smooth5 = function (e) { return e * e * e * (e * (e * 6 - 15) + 10); };

  /* ---- tiny 3x3 matrices (row-major) with the same conventions as CSS rotateX / rotateY ---- */
  var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function mul(a, b) {
    var o = [], i, j; for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    return o;
  }
  function rx(deg) { var c = Math.cos(deg * RAD), s = Math.sin(deg * RAD); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function ry(deg) { var c = Math.cos(deg * RAD), s = Math.sin(deg * RAD); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function ap(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function m3d(m) { return 'matrix3d(' + [m[0], m[3], m[6], 0, m[1], m[4], m[7], 0, m[2], m[5], m[8], 0, 0, 0, 0, 1].map(function (n) { return n.toFixed(5); }).join(',') + ')'; }

  /* ======================================================================================
     1. THE SERVICE CUBE
     The section pins while you scroll through it. Scrolling rolls the cube one side to the next (a real quarter turn over an edge,
     springy, and it settles flat on a side when you stop). Drag to look around. Dots, arrow keys and focus move to a side.
     Very short screens: no pin, the cube rolls by itself and you drag / use the dots.
     ====================================================================================== */
  var scene = d.getElementById('cube3d'), cw = d.getElementById('cube3dw'), cam = d.getElementById('cube3dcam'), cpin = d.getElementById('cubePin'), csec = d.getElementById('cube');
  if (scene && cw && cam) (function () {
    var faces = $$('.cube3d__f', cw), btns = $$('.cube__b'), arrows = $$('.cube__a'), cnav = d.getElementById('cubeNav'), floor = $$('.cube3d__fl>i', cam)[0];
    var live = d.getElementById('cubeLive'), cnm = d.getElementById('cubeNm'), ccnt = d.getElementById('cubeCnt'), csh = d.getElementById('cubeSh'), cgo = d.getElementById('cubeGo'), chint = d.getElementById('cubeHint');
    var pinned = !!(cpin && csec && vh() >= (matchMedia('(max-width:899px)').matches ? 540 : 620));
    cw.classList.add('cube3d--js'); if (cnav) cnav.hidden = false; if (live) live.hidden = false; if (chint) chint.hidden = false;
    /* on a touch screen the hint says what a finger does */
    if (chint && !fine) { var l0 = chint.querySelector('li'); if (l0) l0.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path class="up" d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/></svg>Swipe to turn'; }
    var mobv = false, updMob = function () { mobv = matchMedia('(max-width:899px)').matches; }; updMob(); w.addEventListener('resize', updMob, { passive: true });
    var FA = ['#34c47c', '#ff6a2a', '#ffcf33', '#ff5d8f', '#6ab0ff', '#25d366'];
    if (pinned) csec.classList.add('cube--pin');
    scene.setAttribute('tabindex', '0'); scene.setAttribute('aria-roledescription', '3D cube');
    scene.setAttribute('aria-label', 'Our six services as a 3D cube. Use the arrow keys to move between sides.');

    /* sides are placed front, right, top, back, left, bottom, so each step is one quarter roll over an edge.
       Work out the orientation after every roll, and how far to counter-rotate each side's text so it arrives upright. */
    var F = [I3, ry(90), rx(90), ry(180), ry(-90), rx(-90)];
    var N = [[0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 0, -1], [-1, 0, 0], [0, 1, 0]];
    var O = [I3], SEG = [], k, tries = [['y', -90], ['y', 90], ['x', -90], ['x', 90]];
    for (k = 0; k < 5; k++) {
      var done = false;
      tries.forEach(function (c) {
        if (done) return;
        var R = c[0] === 'y' ? ry(c[1]) : rx(c[1]), M2 = mul(R, O[k]), v = ap(M2, N[k + 1]);
        if (Math.abs(v[2] - 1) < 1e-6) { done = true; SEG[k] = { ax: c[0], sg: c[1] / 90 }; O[k + 1] = M2; }
      });
    }
    faces.forEach(function (f, g) {
      var u = ap(O[g], ap(F[g], [0, -1, 0])), ang = Math.atan2(u[0], -u[1]) / RAD, c = f.querySelector('.cube3d__c');
      if (c) c.style.setProperty('--rz', (-Math.round(ang / 90) * 90 || 0) + 'deg');
    });

    var hdrH = parseFloat(getComputedStyle(root).getPropertyValue('--hdr')) || 68;
    var LAMP = (function () { var v = [-0.5, -0.62, 0.6], n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })();
    var r = 0, vr = 0, rT = 0, ox = 0, oy = 0, vox = 0, voy = 0, px = 0, py = 0, tpx = 0, tpy = 0;
    var sdx = 0, sdy = 0, dtype = 'mouse';
    var dragging = false, captured = false, moved = 0, lx = 0, ly = 0, calm = 0, hov = false, seen = false, craf = 0, last = 0;
    var front = -1, cp = 0, interacted = false, autoAt = 0, autoDir = 1, touching = false, tw = null, st = 0;
    var pinRect = function () { var b = cpin.getBoundingClientRect(); return { top: b.top, travel: Math.max(1, b.height - (vh() - hdrH)) }; };
    var targetOf = function (c) {
      var s = clamp(c, 0, 1) * 5, kk = Math.min(4, Math.floor(s)), t = s - kk;
      return kk + smooth5(clamp((t - 0.17) / 0.66, 0, 1));
    };
    var setFront = function (bi) {
      if (bi === front) return;
      var prev = front; front = bi;
      /* the colour of the side in front tints the glow, the floor ring, the progress and the card */
      if (csec) csec.style.setProperty('--cur', FA[bi] || FA[0]);
      if (prev >= 0) {
        /* a real turn: the hint can go, a ring pulses, and a phone gives a tiny tick */
        if (csec) csec.classList.add('cube--used');
        scene.classList.remove('pulse'); void scene.offsetWidth; scene.classList.add('pulse');
        if (!paused() && !fine && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) { try { navigator.vibrate(9); } catch (x) { /* ignore */ } }
      }
      faces.forEach(function (f, i) { f.classList.toggle('is-front', i === bi); });
      btns.forEach(function (c, i) { c.setAttribute('aria-current', i === bi ? 'true' : 'false'); });
      arrows.forEach(function (c) { c.disabled = (+c.getAttribute('data-d') < 0 && bi <= 0) || (+c.getAttribute('data-d') > 0 && bi >= 5); });
      if (live && faces[bi]) {
        cnm.textContent = faces[bi].querySelector('b').textContent; csh.textContent = faces[bi].querySelector('small').textContent;
        ccnt.textContent = '0' + (bi + 1) + ' / 06'; cgo.href = faces[bi].getAttribute('href'); cgo.setAttribute('aria-label', 'Open ' + cnm.textContent);
        live.style.setProperty('--sd', bi >= prev ? 1 : -1);
        live.classList.remove('sw'); void live.offsetWidth; live.classList.add('sw');
      }
    };
    var step = function (now) {
      craf = 0;
      var dt = Math.min(64, Math.max(1, now - (last || now))); last = now;
      var still = paused() ? 0 : 1;
      if (pinned) {
        var pr = pinRect(); cp = clamp((hdrH - pr.top) / pr.travel, 0, 1); rT = targetOf(cp);
      } else if (!dragging && now > autoAt && !hov && !paused()) {
        rT += autoDir; if (rT > 5) { rT = 4; autoDir = -1; } else if (rT < 0) { rT = 1; autoDir = 1; }
        autoAt = now + 3600;
      }
      /* a lightly under-damped spring, so every roll has weight and a tiny settle */
      var n = Math.max(1, Math.round(dt / 16.67)), j;
      for (j = 0; j < n; j++) { vr = (vr + (rT - r) * 0.085) * 0.64; r += vr; }
      /* look-around offsets: drag adds, they drift back */
      if (!dragging) {
        ox += vox; oy += voy; vox *= 0.92; voy *= 0.92;
        if (now > calm) { ox *= 0.94; oy *= 0.94; }
      }
      px += (tpx - px) * 0.08; py += (tpy - py) * 0.08;
      var kk = clamp(Math.floor(r), 0, 4), t = r - kk, sg = SEG[kk];
      var Rs = sg.ax === 'y' ? ry(sg.sg * 90 * t) : rx(sg.sg * 90 * t), M = mul(Rs, O[kk]);
      var lift = Math.sin(Math.PI * clamp(t, 0, 1)), sc = 1 + 0.07 * lift;
      cw.style.transform = m3d(M) + ' scale3d(' + sc.toFixed(4) + ',' + sc.toFixed(4) + ',' + sc.toFixed(4) + ')';
      var tilt = (mobv ? -15 : -8) + clamp(ox, -60, 60) - py * 3 + Math.sin(now / 1700) * 1.1 * still, yaw = (mobv ? -24 : -13) + clamp(oy, -180, 180) + px * 6 + Math.sin(now / 1300) * 1.7 * still;
      cam.style.transform = 'rotateX(' + tilt.toFixed(2) + 'deg) rotateY(' + yaw.toFixed(2) + 'deg)';
      var s = scene.offsetWidth, bob = Math.sin(now / 1400) * s * 0.014 * still - lift * s * 0.05;
      cam.style.translate = '0 ' + bob.toFixed(1) + 'px';
      if (floor) floor.style.scale = (1 - bob / s * 2.2).toFixed(3);
      /* real light: angle between each side and a lamp up-left-front, after the camera and the roll */
      var C = mul(rx(tilt), ry(yaw)), CM = mul(C, M);
      for (j = 0; j < 6; j++) {
        var nv = ap(CM, N[j]), dot = nv[0] * LAMP[0] + nv[1] * LAMP[1] + nv[2] * LAMP[2];
        faces[j].style.setProperty('--l', clamp(dot * 0.8 + 0.5, 0.22, 1).toFixed(3));
      }
      setFront(clamp(Math.round(r), 0, 5));
      if (pinned) {
        csec.style.setProperty('--cp', cp.toFixed(3));
      }
      if (seen) craf = requestAnimationFrame(step);
    };
    var wake = function () { if (!craf) { last = 0; craf = requestAnimationFrame(step); } };
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; if (seen) wake(); }, { rootMargin: '80px' }).observe(scene);
    } else { seen = true; wake(); }

    /* page scrolling used by "go to side", and by the gentle settle onto a side when scrolling stops */
    var cancelTw = function () { tw = null; };
    var twStep = function (now) {
      if (!tw) return;
      var p = clamp((now - tw.t0) / tw.dur, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      w.scrollTo({ top: tw.from + (tw.to - tw.from) * e, behavior: 'instant' });
      if (p < 1) requestAnimationFrame(twStep); else tw = null;
    };
    var scrollTo = function (y, dur) {
      var from = w.scrollY; if (Math.abs(y - from) < 2) return;
      tw = { from: from, to: y, t0: performance.now(), dur: dur || clamp(Math.abs(y - from) * 0.8, 380, 1000) };
      requestAnimationFrame(twStep);
    };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) { w.addEventListener(ev, cancelTw, { passive: true, capture: true }); });
    var yOf = function (i) { var pr = pinRect(); return w.scrollY + pr.top - hdrH + (i / 5) * pr.travel + 1; };
    var goTo = function (i) {
      i = clamp(i, 0, 5); interacted = true;
      if (pinned) scrollTo(yOf(i));
      else { rT = i; autoAt = performance.now() + 6000; }
      wake();
    };
    if (pinned) {
      /* when scrolling stops between two sides, carry on to the next side in the direction you were going
         (a small nudge forward is enough to turn the cube; a tiny one eases back), instead of pulling you back */
      var dir = 1, lastY = w.scrollY;
      var settle = function () {
        st = 0;
        if (tw || dragging || touching) return;
        var pr = pinRect(), c = (hdrH - pr.top) / pr.travel; if (c <= 0.004 || c >= 0.996) return;
        var s5 = c * 5, base = Math.floor(s5), fr = s5 - base, nn;
        if (fr < 0.03 || fr > 0.97) return;
        nn = dir >= 0 ? (fr > 0.1 ? base + 1 : base) : (fr < 0.9 ? base : base + 1);
        if (c * 5 > 4.97 && dir >= 0) return;
        scrollTo(yOf(clamp(nn, 0, 5)), 560);
      };
      w.addEventListener('scroll', function () { var yy = w.scrollY; if (yy !== lastY) { if (!tw) dir = yy > lastY ? 1 : -1; lastY = yy; } if (tw) return; clearTimeout(st); st = setTimeout(settle, 140); }, { passive: true });
      w.addEventListener('touchstart', function () { touching = true; clearTimeout(st); }, { passive: true });
      var tEnd = function () { touching = false; clearTimeout(st); st = setTimeout(settle, 260); };
      w.addEventListener('touchend', tEnd, { passive: true }); w.addEventListener('touchcancel', tEnd, { passive: true });
    }
    btns.forEach(function (c) { var sp = c.querySelector('span'); c.setAttribute('aria-label', 'Side ' + c.getAttribute('data-n') + (sp ? ': ' + sp.textContent : '')); });
    btns.forEach(function (c) { c.addEventListener('click', function () { goTo(+c.getAttribute('data-f')); }); });
    arrows.forEach(function (c) { c.addEventListener('click', function () { goTo((front < 0 ? 0 : front) + (+c.getAttribute('data-d'))); }); });
    cw.addEventListener('focusin', function (e) { var f = e.target.closest && e.target.closest('.cube3d__f'); if (f && +f.getAttribute('data-f') !== front) goTo(+f.getAttribute('data-f')); });
    scene.addEventListener('keydown', function (e) {
      var kk2 = e.key, f = front < 0 ? 0 : front;
      if (kk2 === 'ArrowRight' || kk2 === 'ArrowDown') { e.preventDefault(); goTo(f + 1); }
      else if (kk2 === 'ArrowLeft' || kk2 === 'ArrowUp') { e.preventDefault(); goTo(f - 1); }
    });
    /* drag: look around; it drifts back to the scroll-driven pose */
    scene.addEventListener('pointerdown', function (e) { if (e.button > 0) return; dragging = true; captured = false; moved = 0; lx = e.clientX; ly = e.clientY; vox = voy = 0; sdx = sdy = 0; dtype = e.pointerType || 'mouse'; });
    scene.addEventListener('pointermove', function (e) {
      if (fine && e.pointerType === 'mouse' && !dragging) { var b = scene.getBoundingClientRect(); tpx = clamp((e.clientX - (b.left + b.width / 2)) / (b.width * 1.2), -1, 1); tpy = clamp((e.clientY - (b.top + b.height / 2)) / (b.height * 1.2), -1, 1); wake(); }
      if (!dragging) return;
      var dx = e.clientX - lx, dyy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dyy); sdx += dx; sdy += dyy;
      if (moved > 6 && !captured) { captured = true; interacted = true; scene.classList.add('cx-drag'); try { scene.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } }
      if (captured) { oy += dx * 0.55; ox = clamp(ox - dyy * 0.4, -50, 50); voy = dx * 0.07; vox = 0; wake(); }
    });
    scene.addEventListener('pointerenter', function (e) { if (!e.pointerType || e.pointerType === 'mouse') hov = true; });
    scene.addEventListener('pointerleave', function () { hov = false; tpx = tpy = 0; });
    var endDrag = function () {
      if (!dragging) return; dragging = false; scene.classList.remove('cx-drag'); calm = performance.now() + 1600;
      /* a sideways flick of a finger rolls the cube to the next (or the previous) side */
      if (captured && dtype !== 'mouse' && Math.abs(sdx) > 38 && Math.abs(sdx) > Math.abs(sdy) * 1.3) goTo((front < 0 ? 0 : front) + (sdx < 0 ? 1 : -1));
      wake();
    };
    scene.addEventListener('pointerup', endDrag); scene.addEventListener('pointercancel', endDrag);
    /* a click on a side that is not facing you turns the cube to it; a click on the facing side opens it */
    scene.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; return; }
      var f = e.target.closest && e.target.closest('.cube3d__f');
      if (f && +f.getAttribute('data-f') !== front) { e.preventDefault(); goTo(+f.getAttribute('data-f')); }
    }, true);
    w.addEventListener('resize', wake, { passive: true });
    wake();
  })();

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
  if (matchMedia('(min-width:1000px)').matches && d.getElementById('cube')) (function () {
    var HTML = {
      cube: '<b></b><b></b><b></b><b></b><b></b><b></b>',
      gyro: '<i></i><i></i><i></i><u></u>',
      coin: (function () { var h = '', q; for (q = 0; q < 9; q++) h += '<i style="--k:' + q + '"' + (q === 8 ? ' class="top"' : q === 0 ? ' class="bot"' : '') + '></i>'; return h; })(),
      stack: '<i></i><i></i><i></i>'
    };
    /* [section id, kind, size px, top px, right %, depth] */
    var PLAN = [['flow', 'coin', 70, 56, 4, 0.10], ['tools', 'gyro', 84, 60, 5, 0.14], ['services', 'stack', 84, 58, 6, 0.08], ['industries', 'cube', 60, 64, 6, 0.16],
      ['how', 'gyro', 76, 60, 7, 0.1], ['work', 'stack', 80, 60, 5, 0.12], ['learn', 'cube', 56, 64, 8, 0.15], ['pricing', 'coin', 78, 56, 4, 0.12], ['faq', 'gyro', 70, 60, 6, 0.13], ['contact', 'cube', 64, 54, 6, 0.1]];
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
