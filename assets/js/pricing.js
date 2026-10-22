/* pricing.js: billing switch, plan explanations and the plain-language guide. */
(function () {
  'use strict';
  var MG = window.MG, $ = MG.$, $$ = MG.$$, esc = MG.esc, D = window.MG_DATA, inr = MG.inr, root = document.body.dataset.root || '', TAX = MG.TAX;
  var bl = 0, B = D.BILL;

  var bill = $('bill');
  function note(i) { return bl ? 'billed ' + inr(D.PLANS[i].f * B[bl].mult * B[bl].months) + ' per ' + B[bl].unit : 'billed monthly'; }
  if (bill) {
    bill.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return; bl = +t.dataset.i;
      $$('button', bill).forEach(function (x, j) { x.setAttribute('aria-checked', j === bl); });
      $$('.plan[data-plan]').forEach(function (p) { var i = +p.dataset.plan; MG.tw(p.querySelector('.pv'), D.PLANS[i].f * B[bl].mult, inr, 450); p.querySelector('[data-bill]').textContent = note(i); });
    });
    bill.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? bl + 1 : e.key === 'ArrowLeft' ? bl - 1 : -1; if (n < 0 || n > 2) return; e.preventDefault();
      var b = $$('button', bill)[n]; b.click(); b.focus();
    });
  }

  function glossary() {
    MG.modal('Everything in the plans, in simple words', 'Plain explanations of every term you will see.', D.GL.map(function (g) { return '<div class="it"><b>' + esc(g[0]) + '</b><span>' + esc(g[1]) + '</span></div>'; }).join(''));
  }
  /* plain-language labels for the "at a glance" tiles */
  var GL_LABEL = { 'Social posts a month': 'Posts a month', 'Reels a month': 'Short videos a month', 'Meta lead campaigns': 'Instagram & Facebook ads', 'Google ads management': 'Google ads', 'On-site shoots a month': 'Shoots at your place', 'Strategy call': 'Calls with us' };
  var GL_VALUE = { '–': 'Not included', '✓': 'Included', 'Managed': 'We run them', 'Set-up': 'Set up once', 'Report only': 'Report only', 'Monthly': 'Once a month', 'Fortnightly': 'Every 2 weeks', 'Weekly': 'Every week' };
  function tile(g) {
    var v = GL_VALUE[g[1]] || g[1], no = g[1] === '–', num = /^\d+$/.test(g[1]);
    return '<div class="pi__t' + (no ? ' no' : '') + '"><small>' + esc(GL_LABEL[g[0]] || g[0]) + '</small><b>' + esc(num ? g[1] : v) + '</b></div>';
  }
  function planInfo(i) {
    var p = D.PLANS[i], fee = p.f * B[bl].mult, prev = D.PLANS[i - 1], next = D.PLANS[i + 1];
    var gst = TAX ? 'Prices are before GST. GST at ' + TAX + '% is added as a separate line on your invoice.' : 'No GST is added at present because we are not registered for it. GST is charged only once our business is registered, and it would be shown as a separate line on your invoice.';
    var html = '<p class="pi__sum">' + esc(p.plain) + '</p>' +
      '<h4 class="pi__h">The plan at a glance</h4><div class="pi__g">' + p.g.map(tile).join('') + '</div>' +
      '<h4 class="pi__h">What it costs</h4><div class="pi__pay"><div><small>You pay us</small><b>' + inr(fee) + '</b><span>' + (bl ? 'a month, billed ' + esc(B[bl].label.toLowerCase()) : 'a month') + '</span></div>' +
      '<div><small>' + (i === 0 ? 'Ad money (optional)' : 'You pay Google and Meta') + '</small><b>' + esc(p.ads) + '</b><span>' + (i === 0 ? 'only if you add ads later' : 'a month, straight to them') + '</span></div></div>' +
      '<p class="pi__fine">' + esc(p.adnote) + ' We take no commission on ad money.</p>' +
      '<h4 class="pi__h">' + (prev ? 'What you get: everything in ' + esc(prev.n) + ', plus' : 'What you get every month') + '</h4><p class="pi__tip">Tap any line to see what it means.</p>' +
      '<div class="pi__x">' + p.x.map(function (x, n) { return '<details' + (n === 0 ? ' open' : '') + '><summary><span>' + esc(x[0]) + '</span></summary><p>' + esc(x[1]) + '</p></details>'; }).join('') + '</div>' +
      (prev ? '<details class="pi__prev"><summary>See what is already in ' + esc(prev.n) + '</summary><ul>' + prev.feat.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' : '') +
      '<div class="pi__fit"><div class="pi__y"><b>Good fit if</b><span>' + esc(p.fit) + '</span></div><div class="pi__n"><b>Maybe not if</b><span>' + esc(p.skip) + '</span></div></div>' +
      '<p class="pi__fine">Month to month, no lock-in. ' + esc(gst) + '</p>' +
      '<div class="cta-row pi__cta"><a class="btn" href="' + root + 'tools/' + MG.idx + '?plan=' + p.slug + '#meet">Choose ' + esc(p.n) + '</a><button type="button" class="btn btn--ghost" id="mg1">Explain the terms</button></div>' +
      '<div class="pi__nav">' + (prev ? '<button type="button" data-go="' + (i - 1) + '"><span aria-hidden="true">&larr;</span> ' + esc(prev.n) + ' <small>' + inr(prev.f * B[bl].mult) + '</small></button>' : '<span></span>') +
      (next ? '<button type="button" data-go="' + (i + 1) + '">' + esc(next.n) + ' <small>' + inr(next.f * B[bl].mult) + '</small> <span aria-hidden="true">&rarr;</span></button>' : '<span></span>') + '</div>';
    MG.modal(p.n + ' plan, in simple words', inr(fee) + ' a month, our fee only', html, function (m) {
      var g = $('mg1'); if (g) g.onclick = glossary;
      $$('[data-go]', m).forEach(function (b) { b.onclick = function () { planInfo(+b.dataset.go); }; });
    });
  }
  document.addEventListener('click', function (e) {
    var i = e.target.closest('[data-plan-info]'); if (i) { e.preventDefault(); planInfo(+i.dataset.planInfo); return; }
    if (e.target.closest('[data-glossary]')) { e.preventDefault(); glossary(); }
  });
})();
