/* reach.js: the "local reach" 3D scene on the home page. Decoration only: the four steps beside it carry all the words.
   - Scrolling tells the story. The section pins, and how far you have scrolled picks the step and swings the camera round the city.
   - Short screens: no pin, the story plays by itself while it is on screen, and the steps are buttons.
   - Nothing runs for prefers-reduced-motion (the scene stays complete and still, which is also what you get without JavaScript).
   - Cost: one class change per step, and one custom property on about 16 elements while the camera swings. Idle loops are CSS
     (transform and opacity only) and are paused whenever the scene is off screen or "Pause motion" is on. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var sec = d.getElementById('reach'), pin = d.getElementById('reachPin'), sc = d.getElementById('reach3d');
  if (!sec || !pin || !sc) return;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var inner = pin.querySelector('.reachpin__s'), cam = sc.querySelector('.rc__cam');
  var items = [].slice.call(sec.querySelectorAll('.rc__step')), N = items.length;
  var bbs = [].slice.call(sc.querySelectorAll('[data-bb]'));
  var bar = sc.querySelector('.rc__prog i'), cnt = sc.querySelector('.rcc__n');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var st = -1, yaw = 0, yawT = 0, raf = 0, near = false, pinned = false, timer = 0, used = false, cntRaf = 0;
  var YAW_STAGE = [-14, -5, 5, 14];

  sec.classList.add('rc--js');
  sc.classList.remove('is-static');

  /* browsers without container-query units get the scene unit from here */
  var cq = !!(w.CSS && CSS.supports && CSS.supports('width', '1cqw'));
  var size = function () { sc.style.setProperty('--u', Math.min(sc.clientWidth / 470, sc.clientHeight / 400).toFixed(4) + 'px'); };
  if (!cq) { size(); w.addEventListener('resize', size, { passive: true }); }

  /* the step titles become buttons (without JavaScript they stay plain headings) */
  items.forEach(function (li, i) {
    var h = li.querySelector('.rc__h'); if (!h) return;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'rc__b'; b.innerHTML = h.innerHTML;
    b.setAttribute('aria-label', 'Show step ' + (i + 1) + ': ' + h.textContent.trim());
    h.textContent = ''; h.appendChild(b);
    b.addEventListener('click', function () { go(i); });
  });

  function paused() { return root.classList.contains('cx-paused'); }

  function countUp() {
    if (!cnt) return;
    cancelAnimationFrame(cntRaf);
    var t0 = performance.now(), to = 24;
    (function f(n) { var p = Math.min((n - t0) / 900, 1), e = 1 - Math.pow(1 - p, 3); cnt.textContent = String(Math.round(to * e)); if (p < 1) cntRaf = requestAnimationFrame(f); })(t0);
  }

  function setStage(i) {
    i = clamp(i, 0, N - 1);
    if (i === st) return;
    var prev = st; st = i;
    sc.setAttribute('data-st', String(i));
    for (var k = 1; k < N; k++) sc.classList.toggle('s' + k, i >= k);
    items.forEach(function (li, k) {
      li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i);
      if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (i === N - 1 && prev !== N - 1) countUp();
    if (i !== N - 1 && cnt) { cancelAnimationFrame(cntRaf); cnt.textContent = '24'; }
  }

  /* the camera: ease towards the target angle, and stop the loop as soon as it arrives */
  function applyYaw() { var v = yaw.toFixed(2) + 'deg'; cam.style.setProperty('--yaw', v); for (var k = 0; k < bbs.length; k++) bbs[k].style.setProperty('--yaw', v); }
  function tick() {
    raf = 0; var dl = yawT - yaw;
    if (Math.abs(dl) < 0.05) { yaw = yawT; applyYaw(); return; }
    yaw += dl * 0.15; applyYaw(); raf = requestAnimationFrame(tick);
  }
  function wake() { if (!raf) raf = requestAnimationFrame(tick); }

  /* ---- pinned: scroll position is the story ---- */
  function hdr() { return parseFloat(getComputedStyle(root).getPropertyValue('--hdr')) || 68; }
  function progress() {
    var r = pin.getBoundingClientRect(), range = pin.offsetHeight - inner.offsetHeight;
    return range > 0 ? clamp((hdr() - r.top) / range, 0, 1) : 0;
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function update() {
    ticking = false;
    if (!pinned || !near) return;
    var p = progress();
    setStage(Math.floor(p * N * 0.9999));
    yawT = -16 + p * 32;
    if (bar) bar.style.setProperty('--cp', p.toFixed(3));
    wake();
  }

  function go(i) {
    used = true; stopAuto();
    if (pinned) {
      var r = pin.getBoundingClientRect(), top = r.top + (w.pageYOffset || root.scrollTop), range = pin.offsetHeight - inner.offsetHeight;
      w.scrollTo({ top: top - hdr() + range * ((i + 0.5) / N), behavior: 'smooth' });
    } else { setStage(i); yawT = YAW_STAGE[i] || 0; wake(); }
  }

  /* ---- not pinned: the story plays by itself while it is on screen, until the visitor takes over ---- */
  function stopAuto() { clearTimeout(timer); timer = 0; }
  function auto() {
    stopAuto();
    if (pinned || used || !near) return;
    timer = setTimeout(function () {
      if (!paused() && !d.hidden) { var n = (st + 1) % N; setStage(n); yawT = YAW_STAGE[n] || 0; wake(); }
      auto();
    }, 4200);
  }

  function layout() {
    var want = w.innerHeight >= 560;
    if (want !== pinned) { pinned = want; sec.classList.toggle('rc--pin', pinned); }
    if (pinned) { stopAuto(); update(); } else { if (st < 0) { setStage(0); yawT = YAW_STAGE[0]; wake(); } auto(); }
  }
  w.addEventListener('resize', layout, { passive: true });
  w.addEventListener('scroll', onScroll, { passive: true });

  /* idle loops and the scroll maths only run while the section is near the screen */
  var seen = false;
  function watch(vis) {
    near = vis; sc.classList.toggle('is-live', vis);
    if (vis && !seen) { seen = true; sc.classList.add('is-in'); }
    if (vis) { if (pinned) update(); else auto(); } else stopAuto();
  }
  setStage(0); yawT = YAW_STAGE[0]; yaw = yawT; applyYaw();
  layout();
  if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { watch(es[0].isIntersecting); }, { rootMargin: '120px' }).observe(pin);
  else watch(true);
})();
