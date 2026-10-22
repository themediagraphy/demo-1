/* creative.js: "generic AI creative vs local human creative" comparison. */
(function () {
  'use strict';
  var MG = window.MG, $ = MG.$, $$ = MG.$$, wa = MG.wa;
  if (!$('cmp')) return;
  var CM = 'cmp', CA = 1, CL = 0;
  var AR = [{ n: 'Kalyan East', d: 'कल्याण पूर्व', l: 'Chinchpada Road', r: 'Chinchpada Rd' }, { n: 'Dombivli East', d: 'डोंबिवली पूर्व', l: 'Phadke Road', r: 'Phadke Rd' }, { n: 'Ulhasnagar', d: 'उल्हासनगर', l: 'Camp 3 Chowk', r: 'Camp 3' }, { n: 'Titwala', d: 'टिटवाळा', l: 'Titwala Station Road', r: 'Station Rd' }];
  var LG = [
    { k: 'मराठी', h: function (a) { return a.d + ' मध्येच, तुमचा हक्काचा डॉक्टर'; }, t: function (a) { return a.l + ' जवळ · आजच भेट ठरवा'; }, c: 'WhatsApp वर बुक करा' },
    { k: 'हिंदी', h: function (a) { return a.d + ' में ही, आपका अपना डॉक्टर'; }, t: function (a) { return a.l + ' के पास · आज ही मिलें'; }, c: 'WhatsApp पर बुक करें' },
    { k: 'English', h: function (a) { return 'Right here in ' + a.n + '. Your own doctor.'; }, t: function (a) { return 'Near ' + a.l + ' · Book today'; }, c: 'Book on WhatsApp' }];
  var GN = ['Glossy stock look. Nobody in Kalyan sees a real clinic, doctor or street here, so there is nothing to trust.', 'The skyline could be anywhere. Dombivli customers look for Phadke Road or Station Road, not a generic city.', 'English-only corporate copy. Most local customers decide in Marathi or Hindi, over WhatsApp.', 'A vague "Learn More" button sends people to a website. Local buyers want to message first.'];
  var LNL = ['Shot at the real clinic on your own street, so people recognise the place before they read a word.', 'Marathi, Hindi or English copy chosen for the area. It sounds like a neighbour, not a brand.', 'The landmark tells people it is close by. Change the area above and watch it update.', 'One tap opens WhatsApp with a ready message, which is how local customers actually book.'];
  var MET = [['Feels like your neighbourhood', 22, 91], ['Marathi / Hindi language fit', 15, 94], ['Trust signals (real shop, real face)', 18, 88], ['Easy way to enquire (WhatsApp)', 30, 82]];
  var KP = [['What the customer sees', 'A stock image', 'Their own street'], ['How they respond', 'Scroll past', 'Tap to WhatsApp']];

  function note(w, i) {
    $$('.pin', $('w-' + w)).forEach(function (p, j) { p.classList.toggle('on', j === i); });
    $('n-' + w).innerHTML = '<b>' + (i + 1) + '.</b> ' + (w === 'gen' ? GN : LNL)[i];
  }
  $$('#creative .pin').forEach(function (p) { p.addEventListener('click', function () { note(p.closest('.adw').id.slice(2), +p.dataset.i); }); });

  function score() {
    var g = CM !== 'loc', l = CM !== 'gen';
    $('cs').innerHTML = '<h3 style="margin-bottom:4px">How we rate these two ads</h3><p class="note" style="margin:0 0 8px">Our own creative rating out of 100, based on what we look for in a local ad. It is a judgement, not measured results.</p>' +
      '<div class="lg2">' + (g ? '<span><i style="background:#9a9aa8"></i>Generic AI</span>' : '') + (l ? '<span><i style="background:var(--acc)"></i>Local human</span>' : '') + '</div>' +
      MET.map(function (m) { return '<div class="srow"><span><b>' + m[0] + '</b><em style="font-style:normal">' + (g ? m[1] + '%' : '') + (g && l ? ' → ' : '') + (l ? m[2] + '%' : '') + '</em></span>' + (g ? '<div class="sb"><i class="g" style="width:' + m[1] + '%"></i></div>' : '') + (l ? '<div class="sb"><i class="l" style="width:' + m[2] + '%"></i></div>' : '') + '</div>'; }).join('') +
      '<div class="kk">' + KP.map(function (k) { return '<div><small>' + k[0] + '</small><b>' + (g ? k[1] : '') + (g && l ? ' → ' : '') + (l ? k[2] : '') + '</b></div>'; }).join('') + '</div>';
  }
  function loc() {
    var a = AR[CA], g = LG[CL];
    $('lh').innerHTML = '<b>' + g.h(a) + '</b>'; $('cvx').textContent = g.t(a); $('lc').textContent = g.c; $('lw').textContent = a.r; $('lsub').textContent = 'Sponsored · ' + a.n; $('sg').textContent = a.r;
    $('lh').lang = $('cvx').lang = $('lc').lang = CL === 0 ? 'mr' : CL === 1 ? 'hi' : 'en';
    $('cw').href = wa('Hi Mediagraphy! I run a business in ' + a.n + '. I want an on-site creative shoot like the local ad (in ' + g.k + ').');
  }
  function chipRow(id, arr, get, set) {
    $(id).innerHTML = '';
    arr.forEach(function (x, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = x; b.setAttribute('aria-pressed', get() === i);
      b.onclick = function () { set(i); chipRow(id, arr, get, set); loc(); }; $(id).appendChild(b);
    });
  }
  chipRow('ca', AR.map(function (a) { return a.n; }), function () { return CA; }, function (i) { CA = i; });
  chipRow('cl', LG.map(function (l) { return l.k; }), function () { return CL; }, function (i) { CL = i; });
  $$('#cvm button').forEach(function (b) {
    b.addEventListener('click', function () {
      CM = b.dataset.m; $('cmp').className = 'cmp m-' + CM; $$('#cvm button').forEach(function (x) { x.setAttribute('aria-checked', x === b); }); score();
    });
  });
  $('cchk').addEventListener('change', function () {
    var n = $$('#cchk input').filter(function (c) { return c.checked; }).length;
    $('cco').innerHTML = n === 0 ? 'Tick the boxes that describe your current ad.' : n <= 1 ? '<b>Mostly local.</b> You are close, only small fixes are needed.' : n <= 3 ? '<b>Partly generic.</b> A local shoot and Marathi or Hindi copy would clearly help.' :
      '<b>Very generic.</b> This ad probably looks like everyone else\'s. <a href="' + wa('Namaste Mediagraphy! My ad ticks ' + n + ' of 5 generic signs. I want an on-site shoot.') + '" target="_blank" rel="noopener noreferrer"><u>Book an on-site shoot on WhatsApp</u></a>';
  });
  note('gen', 0); note('loc', 0); loc(); score();
})();
