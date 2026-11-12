/* cinema.js: reel-style, 3D motion layer. Everything here is decoration.
   - Content is complete without it (elements are only hidden after this script has marked them).
   - Nothing runs for prefers-reduced-motion. A visible "Pause motion" switch stops every loop.
   - No layout shift: only transform, opacity and clip-path are animated. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  try { sessionStorage.setItem('mgi', '1'); } catch (e) { /* private mode */ }
  var red = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (red) return;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var vh = function () { return w.innerHeight || root.clientHeight; };
  var paused = false;
  try { paused = localStorage.getItem('mg_pause') === '1'; } catch (e) { /* ignore */ }
  root.classList.add('cx-on');
  if (paused) root.classList.add('cx-paused');

  /* ---------- the opener: remove it from the DOM when done ---------- */
  var intro = d.getElementById('intro');
  if (intro) {
    var gone = false;
    var drop = function () { if (intro.parentNode) intro.parentNode.removeChild(intro); };
    var skip = function () { if (gone) return; gone = true; root.classList.add('introskip'); intro.classList.add('intro--skip'); setTimeout(drop, 340); };
    intro.addEventListener('pointerdown', skip);
    addEventListener('keydown', function (e) { if (!gone && (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter')) skip(); });
    var pct = d.getElementById('introPct'), tc = d.getElementById('introTc');
    if (pct) {
      var t0 = performance.now(), z2 = function (v) { return (v < 10 ? '0' : '') + v; }, tick = function (now) {
        if (gone || !pct.parentNode) return;
        var p = Math.min(1, Math.max(0, (now - t0 - 200) / 1750)), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, el = Math.max(0, now - t0);
        pct.textContent = Math.round(e * 100);
        /* the camera timecode in the corner: hours:minutes:seconds:frames at 25 fps */
        if (tc && el < 2200) tc.textContent = '00:00:' + z2(Math.floor(el / 1000)) + ':' + z2(Math.floor((el % 1000) / 40));
        if (p < 1 || el < 2000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    setTimeout(function () { if (!gone) { gone = true; drop(); } }, 3900);
  }

  /* ---------- 1. split headings into masked words ---------- */
  function split(node, st) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = d.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(t)); return; }
          var o = d.createElement('span'), i = d.createElement('span');
          o.className = 'wd'; i.textContent = t; i.style.setProperty('--w', Math.min(st.n++, 14));
          o.appendChild(i); frag.appendChild(o);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName === 'EM') { split(n, st); }
    });
  }
  var below = function (el) { return el.getBoundingClientRect().top > vh() * 0.92; };

  var waiting = [];
  var show = function (t) {
    if (t.classList.contains('cx-in')) return;
    t.classList.add('cx-in'); if (io) io.unobserve(t);
    if (t.classList.contains('cx')) setTimeout(function () { t.classList.remove('cx'); t.removeAttribute('data-cx'); }, 1500 + (parseInt(t.style.getPropertyValue('--ci'), 10) || 0) * 70);
  };
  var io = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) show(e.target); });
  }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' }) : null;
  var reveal = function (el) { waiting.push(el); if (io) io.observe(el); else el.classList.add('cx-in'); };
  /* a fast flick can jump past an element before the observer sees it: anything now level with or above the fold is shown */
  var sweepT = 0;
  var sweep = function () {
    sweepT = 0; var lim = vh() * 0.92;
    waiting = waiting.filter(function (el) {
      if (el.classList.contains('cx-in')) return false;
      var r = el.getBoundingClientRect();
      if ((r.width || r.height) && r.top < lim) { show(el); return false; }
      return true;
    });
  };
  addEventListener('scroll', function () { if (!sweepT) sweepT = setTimeout(sweep, 140); }, { passive: true });

  $$('.sec-head h2').forEach(function (h) {
    if (!below(h)) return;
    split(h, { n: 0 }); h.classList.add('cx-split'); reveal(h);
  });

  $$('.phero h1').forEach(function (h) {
    if (h.querySelector('a,span,br')) return;
    split(h, { n: 0 }); h.classList.add('cx-split'); setTimeout(function () { h.classList.add('cx-in'); }, 160);
  });

  /* ---------- 2. reveals with variety (only below the fold, only after marking) ---------- */
  var MAP = [
    ['.sec-head .kicker', 'left'], ['.sec-head > p:not(.kicker)', 'up'],
    ['.trust li', 'flip'], ['.bento > li', 'flip'], ['.ind > .ic', 'pop'],
    ['.tool-list > .tool', 'swing'], ['.qe', 'right'], ['.faqs > .faq', 'flip'],
    ['.cards3 > *', 'rise'], ['.fnd > *', 'up'], ['.ft__g > *', 'up'],
    ['.cmp > *', 'zoom'], ['.steps > *:not(.steps__line)', 'swing'],
    ['.cubewrap__t > *:not(.cube__all)', 'up'], ['.cube3d', 'zoom']
  ];
  MAP.forEach(function (m) {
    $$(m[0]).forEach(function (el, i) {
      if (el.classList.contains('rv') || el.classList.contains('cx') || !below(el)) return;
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : i;
      el.classList.add('cx'); el.setAttribute('data-cx', m[1]); el.style.setProperty('--ci', Math.min(sibs, 8));
      reveal(el);
    });
  });
  /* icons that draw themselves when their card arrives */
  $$('.trust .ti svg, .svc__i svg, .bm svg').forEach(function (s, i) {
    $$('path,circle,rect,line,polyline,ellipse', s).forEach(function (p) { p.setAttribute('pathLength', '1'); });
    s.classList.add('cx-draw');
    var host = s.closest('li,.ic'); if (host && !host.classList.contains('cx')) { host.classList.add('cx-hold'); reveal(host); }
  });
  /* safety net: after 7 s anything still waiting is shown, so nothing can stay hidden */
  setTimeout(function () { $$('.cx:not(.cx-in),.cx-split:not(.cx-in),.cx-hold:not(.cx-in)').forEach(function (e) { if (!below(e)) e.classList.add('cx-in'); }); }, 7000);
  addEventListener('beforeprint', function () { $$('.cx,.cx-split,.cx-hold').forEach(function (e) { e.classList.add('cx-in'); }); });

  /* ---------- 3. hero: floating shapes, spotlight, pointer depth ---------- */
  var hero = d.querySelector('.hero');
  if (hero) {
    var fx = d.createElement('div'); fx.className = 'hero__fx'; fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<i class="aur aur--a"></i><i class="aur aur--b"></i><i class="glow"></i><i class="sh sh--ring"></i><i class="sh sh--cube"><b></b><b></b><b></b><b></b><b></b><b></b></i><i class="sh sh--dot"></i><i class="sh sh--sq2"></i><i class="sh sh--plus"></i>' +
      '<i class="sh sh--sq3"><svg viewBox="0 0 100 24" focusable="false"><path d="M2 12c8-12 16 12 24 0s16 12 24 0 16 12 24 0 16 12 24 0"/></svg></i>';
    hero.insertBefore(fx, hero.firstChild);
    if (fine) {
      var hr = null, pend = false, px = 0, py = 0;
      hero.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY; if (pend) return; pend = true;
        requestAnimationFrame(function () {
          pend = false; hr = hero.getBoundingClientRect();
          var x = px - hr.left, y = py - hr.top;
          hero.style.setProperty('--mx', ((x / hr.width) * 2 - 1).toFixed(3));
          hero.style.setProperty('--my', ((y / hr.height) * 2 - 1).toFixed(3));
          hero.style.setProperty('--sx', Math.round(x) + 'px'); hero.style.setProperty('--sy', Math.round(y) + 'px');
          hero.classList.add('cx-hot');
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { hero.classList.remove('cx-hot'); hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
    }
  }

  /* ---------- 4. scroll loop: parallax, progress-linked values, marquee speed ---------- */
  var px$ = [], vis = new Set();
  $$('.eng, .hero__fx .sh, .hero__fx .aur').forEach(function (el) { el.setAttribute('data-px', el.classList.contains('eng') ? '-0.06' : (el.classList.contains('sh--sq3') ? '0.12' : (el.classList.contains('aur') ? '0.04' : '0.08'))); });
  $$('[data-px]').forEach(function (el) { px$.push({ el: el, f: parseFloat(el.dataset.px) || 0 }); });
  var pio = io ? new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); }); }, { rootMargin: '120px' }) : null;
  px$.forEach(function (o) { if (pio) pio.observe(o.el); else vis.add(o.el); });

  var bands = $$('.mq__t').map(function (t) {
    var a = t.getAnimations ? t.getAnimations()[0] : null;
    return { t: t, a: a, band: t.parentNode, dir: t.parentNode.getAttribute('data-dir') === '-1' ? -1 : 1, rate: 1 };
  });
  var lastY = w.scrollY, lastT = performance.now(), vel = 0, sdir = 1, ticking = false, raf = 0;
  function frame(now) {
    raf = 0;
    var y = w.scrollY, dt = Math.max(1, now - lastT), v = (y - lastY) / dt; lastY = y; lastT = now;
    vel += (v - vel) * 0.18; if (Math.abs(vel) < 0.003) vel = 0; if (Math.abs(vel) > 0.04) sdir = vel > 0 ? 1 : -1;
    var boost = Math.min(7, Math.abs(vel) * 4.2), live = Math.abs(vel) > 0.01;
    if (!paused) {
      bands.forEach(function (b) {
        var target = (1 + boost) * (sdir < 0 && boost > 0.6 ? -1 : 1);
        b.rate += (target - b.rate) * 0.12;
        if (b.a && b.a.updatePlaybackRate && Math.abs(b.rate - (b.a.playbackRate || 1)) > 0.01) b.a.updatePlaybackRate(b.rate);
        b.band.style.setProperty('--sk', (Math.max(-9, Math.min(9, -vel * 5.2))).toFixed(2));
        if (Math.abs(b.rate - 1) > 0.05) live = true;
      });
      var vhh = vh();
      vis.forEach(function (el) {
        var o = px$.find(function (q) { return q.el === el; }); if (!o) return;
        var r = el.getBoundingClientRect(), c = r.top + r.height / 2 - vhh / 2;
        el.style.setProperty('--py', (c * o.f).toFixed(1) + 'px');
      });
    }
    if (live || vel !== 0 || v !== 0) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });
  kick();

  /* ---------- 5. light that follows the pointer on cards (no tilting: the cards stay flat and sharp), magnetic buttons, click ripple ---------- */
  if (fine) {
    $$('.plan, .lnk-card, .ic, .svc, .tool, .qe, .bento > li').forEach(function (c) {
      if (c.closest('.plans-g') && matchMedia('(max-width:759px)').matches) return;
      c.classList.add('cx-tilt'); var g = d.createElement('i'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); c.appendChild(g);
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.classList.add('cx-tilting'); c.style.setProperty('--gx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
      }, { passive: true });
      c.addEventListener('pointerleave', function () { c.classList.remove('cx-tilting'); });
    });
    $$('.svc, .tool, .faq, .qe').forEach(function (c) {
      c.classList.add('cx-spot');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(); c.style.setProperty('--spx', (e.clientX - r.left).toFixed(0) + 'px'); c.style.setProperty('--spy', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
    $$('.hero .btn, #contact .btn, .cta-row .btn--lg').forEach(function (b) {
      b.classList.add('cx-mag');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        b.classList.add('cx-magging'); b.style.setProperty('--tx', (x * 0.22).toFixed(1) + 'px'); b.style.setProperty('--ty', (y * 0.32).toFixed(1) + 'px');
      }, { passive: true });
      b.addEventListener('pointerleave', function () { b.classList.remove('cx-magging'); b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
    });
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b || paused || b.classList.contains('fab')) return;
    var r = b.getBoundingClientRect(), s = d.createElement('span'); s.className = 'rpl';
    s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px'; b.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
  });

  /* ---------- 6. header: a pill slides under the hovered item ---------- */
  var nav = d.getElementById('nav');
  if (nav && fine) {
    var pill = d.createElement('i'); pill.className = 'nav__pill'; pill.setAttribute('aria-hidden', 'true'); nav.insertBefore(pill, nav.firstChild);
    var target = function (e) { var t = e.target.closest && e.target.closest('.nav > a, .nav > .dd'); return t && t.parentNode === nav ? t : null; };
    nav.addEventListener('pointerover', function (e) {
      var t = target(e); if (!t) return;
      pill.style.setProperty('--px', t.offsetLeft + 'px'); pill.style.setProperty('--pw', t.offsetWidth + 'px'); nav.classList.add('cx-pill');
    });
    nav.addEventListener('pointerleave', function () { nav.classList.remove('cx-pill'); });
  }

  /* ---------- 7. cursor follower ---------- */
  if (fine) {
    var ring = d.createElement('div'), dot = d.createElement('div');
    ring.className = 'cur'; dot.className = 'cur-dot'; ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    d.body.appendChild(ring); d.body.appendChild(dot);
    var mx = 0, my = 0, rx = 0, ry = 0, run = false;
    function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) requestAnimationFrame(loop); else run = false;
    }
    addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY; ring.classList.add('on'); dot.classList.add('on');
      if (!run) { run = true; requestAnimationFrame(loop); }
      var t = e.target.closest ? e.target.closest('a,button,summary,select,input,textarea,[role=button],.plan,.ic') : null;
      ring.classList.toggle('big', !!t);
      var lbl = e.target.closest ? e.target.closest('.svc,.lnk-card,.plan') : null;
      ring.classList.toggle('txt', !!lbl); dot.classList.toggle('hid', !!lbl); if (lbl) ring.setAttribute('data-t', lbl.matches('.plan') ? 'Plan' : 'Open');
    }, { passive: true });
    d.addEventListener('pointerleave', function () { ring.classList.remove('on'); dot.classList.remove('on'); });
    d.documentElement.addEventListener('mouseleave', function () { ring.classList.remove('on'); dot.classList.remove('on'); });
  }

  /* ---------- 8. (the 3D service cube and the growth-engine scene now live in solid.js) ---------- */

  /* ---------- 9. pause switch (visitor control over all looping motion) ---------- */
  var tog = d.getElementById('motion');
  function setPause(p) {
    paused = p; root.classList.toggle('cx-paused', p);
    if (tog) { tog.setAttribute('aria-pressed', p ? 'true' : 'false'); tog.querySelector('span').textContent = p ? 'Motion paused' : 'Pause motion'; }
    try { localStorage.setItem('mg_pause', p ? '1' : '0'); } catch (e) { /* ignore */ }
    bands.forEach(function (b) { if (b.a) { p ? b.a.pause() : b.a.play(); } });
  }
  if (tog) { tog.hidden = false; tog.addEventListener('click', function () { setPause(!paused); }); setPause(paused); }
})();
