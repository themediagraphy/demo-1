/* calc.js: audit scoring and lead estimator maths. Pure functions, no DOM, so they can be tested in Node. */
(function (root) {
  'use strict';
  var MG = root.MG = root.MG || {};
  var DATA = root.MG_DATA || { BT: [], PLANS: [] };
  var TAX = (root.MG && root.MG.TAX) || ((root.MG_CONFIG && root.MG_CONFIG.gstRegistered) ? (root.MG_CONFIG.gstRate || 18) : 0);

  var CATS = ['Local SEO & Google', 'Website', 'Social media', 'Ads & Tracking', 'WhatsApp & Follow-up'];
  var CAT_HINT = ['How people find you on Google Maps', 'What visitors see when they open your site', 'How active and local you look online', 'Whether paid ads are measured and aimed well', 'What happens after someone enquires'];
  var PER = 4; /* items per category: ITEMS are stored category by category, so item i belongs to category floor(i / PER) */
  var ITEMS = [
    /* Local SEO & Google */
    ['Google Business Profile claimed & verified', 'Claim and verify your Google Business Profile. It is free and drives "near me" calls.'],
    ['4.2★+ rating with 25+ Google reviews', 'Put a review QR card at your counter and ask every happy customer for a Google review.'],
    ['Photos, timings, services and call button updated', 'Add 10+ real photos, correct timings, your services and a WhatsApp link to your Google profile.'],
    ['You reply to every Google review', 'Reply to every Google review within 2 days, good or bad. It shows people that you care and that the business is active.'],
    /* Website */
    ['Website opens in under 3 seconds on mobile', 'Compress images and move to faster hosting. Slow sites lose mobile visitors.'],
    ['Call + WhatsApp button on every page', 'Add a sticky Call and WhatsApp button so visitors reach you in one tap.'],
    ['A landing page with one clear offer and enquiry form', 'Build one page for your best offer with price, photos and a short form. Send ad clicks there.'],
    ['Your website shows services, starting prices and areas served', 'Add a services section with starting prices and the areas you serve, so visitors know at a glance that you are the right shop.'],
    /* Social media */
    ['Posting on Instagram or Facebook every week', 'Plan 3 posts a week in a simple calendar. Consistency beats perfection.'],
    ['Marathi or Hindi reels and local content', 'Shoot short Marathi or Hindi reels at your shop. Local language builds trust.'],
    ['Replying to DMs and comments the same day', 'Check Instagram and Facebook messages twice a day. A late reply is a lost customer.'],
    ['Real photos and videos from your own shop, not stock', 'Shoot your shop, your team and your work on a phone. Real faces and real places beat stock images.'],
    /* Ads & tracking */
    ['Running paid ads from your own ad account', 'Start small Meta and Google campaigns inside your own ad account.'],
    ['Tracking every lead (Pixel, CAPI or call tracking)', 'Set up Meta Pixel with CAPI or call tracking so every enquiry is counted.'],
    ['Knowing your cost per enquiry every month', 'Write down monthly ad spend divided by enquiries. You cannot improve what you do not measure.'],
    ['Ads aimed at your local area, not all of India', 'Set your ads to a radius around your shop or to your main pincodes, so no budget is wasted on people who cannot visit.'],
    /* WhatsApp & follow-up */
    ['WhatsApp Business with catalogue + auto-reply', 'Set up WhatsApp Business with a catalogue, greeting and quick replies.'],
    ['Following up every enquiry within 15 minutes', 'Reply to every enquiry within 15 minutes. Speed wins local customers.'],
    ['A customer list with reminders for repeat visits', 'Keep every customer in a sheet or CRM and message them before festivals or renewals.'],
    ['Missed calls are called back the same day', 'Set a daily reminder to return missed calls. Many local customers simply call the next shop if nobody answers.']
  ];
  /* weights add up to 100, exactly 20 for each category */
  var WT = [8, 6, 3, 3,  5, 5, 6, 4,  5, 6, 4, 5,  5, 7, 4, 4,  4, 7, 4, 5];
  var EF = ['Quick win', '1 week', 'Quick win', 'Quick win',  '1 week', 'Quick win', '1–2 weeks', '1 week',  '1 week', '1–2 weeks', 'Quick win', 'Quick win',  '1 week', '1 week', 'Quick win', 'Quick win',  'Quick win', 'Quick win', '1 week', 'Quick win'];
  var SEAP = {
    h: [.95, .9, .9, .95, 1, 1.15, 1.25, 1.2, 1.1, 1, .95, .95], g: [1.3, 1.1, 1, .95, .9, .8, .85, .95, 1.2, 1.1, 1, .9],
    w: [1.2, 1.15, 1, .85, .8, .75, .75, .85, 1, 1.25, 1.4, 1.3], e: [1.1, 1.1, 1.3, 1.4, 1.3, 1.1, .9, .8, .8, .8, .85, .9],
    f: [1.05, 1, 1, .95, .9, .95, 1.05, 1, 1.1, 1.15, 1.1, 1.15], b: [.95, .95, 1.15, 1.2, 1, .8, .8, .85, .95, 1.2, 1.2, 1],
    r: [1, .95, 1, 1, .95, .9, .9, 1, 1.1, 1.3, 1.35, 1.15], a: [1, .95, 1, 1.05, 1.1, 1.2, 1.1, 1, 1, 1.05, 1, .95],
    y: [1.25, 1.1, 1, .95, .95, 1, .95, .9, 1, 1, .95, .95], s: [1.05, 1, .95, 1, 1.05, .9, .85, .95, 1.05, 1.25, 1.2, 1.15], n: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  };
  var CHN = [['Meta + Google mix', 1, 1], ['Instagram / Facebook', .85, .88], ['Google Search & Maps', 1.25, 1.2], ['Click-to-WhatsApp ads', .8, .95]];
  var SCN = [['Cautious', 1.3, .8], ['Expected', 1, 1], ['Ambitious', .8, 1.15]];
  var RS = [['Within 15 min', 1], ['Same day', .8], ['Next day or later', .55]];
  var RM = [.5, .7, .85, 1, 1.05, 1.1];

  /* business-type accessor: DATA.BT rows are [name, slug, svg, cost/enquiry, avg sale, close %, base enquiries, tips, repeat/yr, margin %, season key, benchmark] */
  function bt(i) { var r = DATA.BT[i]; return { name: r[0], slug: r[1], svg: r[2], cpl: r[3], tk: r[4], cl: r[5], base: r[6], tips: r[7], rep: r[8], mg: r[9], sea: r[10], bmk: r[11] }; }
  function seaF(i, month) { var b = bt(i); return SEAP[b.sea][month == null ? new Date().getMonth() : month]; }
  function planFor(b) { return b < 8000 ? 0 : b < 15000 ? 1 : b < 30000 ? 2 : b < 60000 ? 3 : 4; }
  function planFee(i) { return DATA.PLANS[i].f; }

  function audit(p) {
    var k = p.checks, b = bt(p.bti), month = p.month, comp = +p.comp, cur = Math.max(0, +p.cur || 0), av = +p.area;
    var s = k.reduce(function (a, v, i) { return a + (v ? WT[i] : 0); }, 0);
    var sf = seaF(p.bti, month);
    var miss = Math.max(0, Math.round(cur > 0 ? cur * Math.min(2.5, (100 / Math.max(s, 25) - 1) * .55) : b.base * av * sf * comp * (100 - s) / 100));
    var mlo = Math.round(miss * .7), mhi = Math.round(miss * 1.3), opp = miss * b.cl / 100 * b.tk, olo = opp * .7, ohi = opp * 1.3;
    var bm = b.bmk + Math.round((comp - 1) * -20), diff = s - bm;
    var cs = CATS.map(function (n, i) {
      var got = 0, tot = 0, miss = 0;
      for (var j = 0; j < PER; j++) { var q = i * PER + j; tot += WT[q]; if (k[q]) got += WT[q]; else miss++; }
      return [n, Math.round(got * 100 / tot), miss];
    });
    var wk = cs.slice().sort(function (a, b2) { return a[1] - b2[1]; })[0];
    var grade = s >= 80 ? 'Strong foundation' : s >= 55 ? 'Good start' : s >= 30 ? 'Needs work' : 'Big opportunity';
    var open = ITEMS.map(function (x, i) { return { t: x[1], n: x[0], w: WT[i], e: EF[i], i: i, c: Math.floor(i / PER) }; }).filter(function (o) { return !k[o.i]; });
    var byW = function (a, b2) { return b2.w - a.w || a.i - b2.i; };
    var qw = open.filter(function (o) { return o.e === 'Quick win'; }).sort(byW), bp = open.filter(function (o) { return o.e !== 'Quick win'; }).sort(byW);
    var fx = qw.slice(0, 3).concat(bp.slice(0, 2)).sort(byW).slice(0, 5);
    var pl = s < 25 ? 0 : s < 45 ? 1 : s < 65 ? 2 : s < 82 ? 3 : 4;
    var plan = [['Week 1', fx[0] ? fx[0].t : 'Review what is working and plan your next offer.'], ['Week 2', fx[1] ? fx[1].t : b.tips[0]], ['Week 3', fx[2] ? fx[2].t : b.tips[1]],
      ['Week 4', s >= 70 ? 'Scale your best campaign and test a new offer.' : 'Launch a small paid campaign and review the first numbers.']];
    var sn = sf >= 1.1 ? 'Peak season now, so move fast: demand is about ' + Math.round((sf - 1) * 100) + '% above normal.' : sf <= .9 ? 'Slow season now. Use it to fix the basics before demand returns.' : 'Demand is near normal this month.';
    return { s: s, b: b, sf: sf, miss: miss, mlo: mlo, mhi: mhi, olo: olo, ohi: ohi, bm: bm, diff: diff, cs: cs, wk: wk, grade: grade, fx: fx, qw: qw.slice(0, 4), bp: bp.slice(0, 3), left: open.length, pl: pl, plan: plan, sn: sn, tips: b.tips };
  }

  function estimate(p) {
    var b = bt(p.bti), bud = +p.budget, sc = SCN[p.scn == null ? 1 : p.scn], ch = CHN[p.chn || 0], rs = RS[p.rs || 0];
    var sf = (+p.season) || seaF(p.bti, p.month), mg = +p.margin, rep = +p.repeat, tk = +p.ticket || 0, av = +p.area;
    var cl = Math.min(95, (+p.close) * sc[2] * ch[2] * rs[1] * Math.min(1.08, Math.pow(sf, .3)));
    var cpl = b.cpl * ch[1] * sc[1] * av / Math.pow(sf, .6), enq = bud / cpl, cu = enq * cl / 100, rv = cu * tk;
    var pl = planFor(bud), fee = planFee(pl) * (1 + TAX / 100), inv = bud + fee, ltv = cu * tk * rep, pf = rv * mg / 100 - inv;
    var ci = 0, cr = 0, cum = RM.map(function (m) { ci += inv; cr += rv * m; return [ci, cr]; });
    var be = -1; for (var i = 0; i < cum.length; i++) { if (cum[i][1] >= cum[i][0]) { be = i; break; } }
    return { b: b, bud: bud, sc: sc, ch: ch, rs: rs, sf: sf, cl: cl, cpl: cpl, enq: enq, cu: cu, rv: rv, pl: pl, fee: fee, inv: inv, ltv: ltv, pf: pf, cum: cum, be: be,
      mx: Math.max.apply(null, cum.map(function (x) { return Math.max(x[0], x[1]); }).concat([1])), elo: Math.round(enq * .75), ehi: Math.round(enq * 1.25) };
  }

  MG.calc = { CATS: CATS, CAT_HINT: CAT_HINT, PER: PER, ITEMS: ITEMS, WT: WT, EF: EF, CHN: CHN, SCN: SCN, RS: RS, RM: RM, bt: bt, seaF: seaF, planFor: planFor, audit: audit, estimate: estimate, TAX: TAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = MG.calc;
})(typeof window !== 'undefined' ? window : globalThis);
