/* home.js: quick estimator, service finder, founders card, contact form, optional real-proof slot. */
(function () {
  'use strict';
  var MG = window.MG, $ = MG.$, $$ = MG.$$, esc = MG.esc, C = MG.calc, D = window.MG_DATA, wa = MG.wa, okPh = MG.okPh, inr = MG.inr, CFG = window.MG_CONFIG || {};
  var root = document.body.dataset.root || '';

  /* ---------- quick estimator ---------- */
  var qb = $('qb'), qr = $('qr');
  function quick() {
    var i = +qb.value, b = C.bt(i), bud = +qr.value;
    var r = C.estimate({ bti: i, budget: bud, scn: 1, chn: 0, rs: 0, season: 0, margin: b.mg, repeat: b.rep, ticket: b.tk, area: 1, close: b.cl });
    $('qv').textContent = inr(bud); $('qo').textContent = r.elo + '–' + r.ehi; $('qc').textContent = '~' + Math.round(r.cu); $('qp').textContent = D.PLANS[r.pl].n + ' (' + inr(D.PLANS[r.pl].f) + '/mo)';
    $('qas').textContent = 'Assumes about ' + inr(r.cpl) + ' per enquiry and ' + Math.round(r.cl) + ' in 100 enquiries becoming customers.';
    $('qgo').href = root + 'tools/' + MG.idx + '?t=' + b.slug + '&b=' + bud + '#estimate';
  }
  if (qb) { qb.addEventListener('input', quick); qr.addEventListener('input', quick); quick(); }

  /* ---------- service finder ---------- */
  var SVN = D.SVN || ['Google Maps & Local SEO', 'Meta Lead Campaigns', 'Social Media Management', 'Websites & Landing Pages', 'WhatsApp Lead Routing', 'On-Site Video Shoots'];
  var SF = [['Clinic', 0, [0, 4, 3], 2, 'Patients search "dentist near me" before anything else, so Maps and WhatsApp booking come first, then a small Meta campaign.'],
    ['Gym', 1, [1, 2, 5], 2, 'Free-trial-pass lead ads plus transformation reels shot in your gym work best in the KDMC belt.'],
    ['Salon', 2, [0, 2, 4], 1, 'Before and after reels, a WhatsApp price list and a strong Maps profile fill the appointment book.'],
    ['Coaching', 3, [1, 2, 3], 2, 'Admission-season lead ads with a landing page, answered on WhatsApp within 15 minutes.'],
    ['Restaurant', 4, [0, 2, 5], 1, 'Maps photos, dish reels and WhatsApp ordering bring walk-ins and orders without heavy ad spend.'],
    ['Builder', 5, [1, 3, 4], 3, 'Site-visit lead ads, a project landing page and instant WhatsApp brochures with fast follow-up.'],
    ['Jeweller', 6, [0, 2, 5], 3, 'Showroom shoots, festive collections and click-to-WhatsApp catalogue ads before Diwali and wedding season.'],
    ['Retail', 7, [0, 1, 5], 1, 'A strong Maps profile, weekend offer ads and a WhatsApp catalogue for repeat customers.']];
  var sf = $('sf');
  if (sf) {
    var cards = $$('#bento .svc'), sfo = $('sfo');
    var pick = function (j) {
      $$('button', sf).forEach(function (x, i) { x.setAttribute('aria-pressed', i === j + 1); });
      if (j < 0) { cards.forEach(function (e) { e.classList.remove('dim', 'hi'); }); sfo.hidden = true; return; }
      var f = SF[j], p = D.PLANS[f[3]];
      cards.forEach(function (e, i) { e.classList.toggle('dim', f[2].indexOf(i) < 0); e.classList.toggle('hi', f[2].indexOf(i) >= 0); });
      sfo.hidden = false;
      sfo.innerHTML = '<b>For a ' + f[0].toLowerCase() + ', start with: ' + f[2].map(function (i) { return SVN[i]; }).join(' + ') + '</b><p>' + f[4] + ' A good starting plan is <b>' + p.n + '</b> (' + inr(p.f) + '/month).</p>' +
        '<div class="cta-row"><a class="btn btn--sm" href="' + root + 'tools/' + MG.idx + '?t=' + D.BT[f[1]][1] + '#audit">Run free audit for ' + f[0].toLowerCase() + '</a><a class="btn btn--sm btn--wa" target="_blank" rel="noopener noreferrer" href="' +
        wa('Namaste Mediagraphy! I run a ' + f[0].toLowerCase() + ' in KDMC. I am interested in: ' + f[2].map(function (i) { return SVN[i]; }).join(', ') + '. Please suggest a plan.') + '">Ask on WhatsApp</a><button type="button" class="btn btn--sm btn--ghost" id="sfr">Show all services</button></div>';
      $('sfr').onclick = function () { pick(-1); };
    };
    ['All'].concat(SF.map(function (x) { return x[0]; })).forEach(function (k, j) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = k; b.setAttribute('aria-pressed', j === 0); b.onclick = function () { pick(j - 1); }; sf.appendChild(b);
    });
  }

  /* ---------- founders card ---------- */
  var ft = $('ftabs');
  if (ft) {
    var NM = ['Team card', 'Ayush Sahu', 'Prakhar Dubey', 'Nikhil Kushwaha'], IM = ['team', 'ayush', 'prakhar', 'nikhil'], faces = $('faces'), fb = $('flipb');
    $$('button', ft).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i; $('cfi').src = root + 'assets/img/card-' + IM[i] + '.webp';
        $('cfi').alt = i ? 'Front of the mediagraphy.in business card of ' + NM[i] + ', Co-Founder' : 'Front of the mediagraphy.in team business card, listing co-founders Ayush Sahu, Prakhar Dubey and Nikhil Kushwaha';
        $$('button', ft).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        if (faces.classList.contains('flip')) flip();
      });
    });
    var flip = function () { var x = faces.classList.toggle('flip'); $('fl').textContent = x ? 'Back face (brand identity and capabilities)' : 'Front face (3.5 × 2.0 inch)'; fb.setAttribute('aria-pressed', x); };
    faces.addEventListener('click', flip); fb.addEventListener('click', flip);
    faces.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  }

  /* ---------- contact form ---------- */
  var cf = $('cform');
  if (cf) {
    cf.addEventListener('submit', function (e) { e.preventDefault(); });   /* never let the browser submit (and put typed details in the URL) */
    var upSend = function () { $('send').href = wa('Namaste Mediagraphy! I am ' + ($('cn').value || '-') + ' from ' + ($('cb').value || '-') + '. ' + $('cd').value); };
    ['cn', 'cb', 'cd'].forEach(function (i) { $(i).addEventListener('input', upSend); }); upSend();
    $('send').addEventListener('click', function () { if (!$('hp').value && ($('cn').value || $('cp').value || $('cd').value)) MG.lead('whatsapp-contact', { name: $('cn').value, phone: $('cp').value, biz: $('cb').value, msg: $('cd').value }); });
    $('cbk').addEventListener('click', function () {
      var m = $('cm'); if ($('hp').value) return;
      var d = { name: $('cn').value.trim(), phone: $('cp').value.trim(), biz: $('cb').value.trim(), msg: $('cd').value.trim() };
      if (!d.name) { m.className = 'msg err'; m.textContent = 'Please enter your name so we know who to call.'; $('cn').focus(); return; }
      if (!okPh(d.phone)) { m.className = 'msg err'; m.textContent = 'Please enter a valid 10-digit mobile number so we can call you back.'; $('cp').focus(); return; }
      m.className = 'msg'; m.textContent = 'Opening WhatsApp…'; MG.lead('callback', d);
      window.open(wa('Namaste Mediagraphy! Please call this client back.\nName: ' + d.name + '\nPhone: ' + d.phone + (d.biz ? '\nBusiness: ' + d.biz : '') + (d.msg ? '\nAbout: ' + d.msg : '') + '\nBest time: any time between 10 AM and 7 PM'), '_blank', 'noopener');
      setTimeout(function () { m.textContent = 'Just press Send in WhatsApp and we will call you back within working hours.'; }, 600);
    });
    var o = MG.isOpen();
    $('lt').textContent = o ? 'Team online now · Mon–Sat, 10 AM–7 PM' : 'Team offline · WhatsApp us, we reply first thing'; if (!o) $('ld').classList.add('off');
  }

  /* ---------- real-proof slot: stays hidden until assets/data/proof.json has approved, real results ---------- */
  var pw = $('proof-wrap');
  if (pw && window.fetch && location.protocol !== 'file:') {
    fetch(root + 'assets/data/proof.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      $('proof').innerHTML = list.slice(0, 6).map(function (x) { return '<div class="proof__c"><span class="big">' + esc(x.value || '') + '</span><b>' + esc(x.metric || '') + '</b><small>' + esc([x.client, x.period].filter(Boolean).join(' · ')) + (x.note ? '<br>' + esc(x.note) : '') + '</small></div>'; }).join('');
      pw.hidden = false;
    }).catch(function () {});
  }
})();
