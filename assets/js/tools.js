/* tools.js: free audit, lead estimator and meeting booker (tools page). */
(function () {
  'use strict';
  var MG = window.MG, $ = MG.$, $$ = MG.$$, esc = MG.esc, C = MG.calc, DATA = window.MG_DATA, CFG = window.MG_CONFIG || {};
  var BT = DATA.BT, PLANS = DATA.PLANS, inr = MG.inr, lk = MG.lk, wa = MG.wa, okPh = MG.okPh;
  var Q = new URLSearchParams(location.search);
  var state = { bti: 0, plan: '' };

  /* ---------- business pickers ---------- */
  var bm = function (svg) { return '<span class="bm"><svg viewBox="-1 -1 26 26" aria-hidden="true">' + svg + '<circle class="dt" cx="22" cy="22" r="1.7"/></svg></span>'; };
  ['atc', 'etc', 'mtc'].forEach(function (id) {
    $(id).innerHTML = BT.map(function (b, i) { return '<button type="button" data-i="' + i + '" aria-pressed="false">' + bm(b[2]) + '<span>' + esc(b[0]) + '</span></button>'; }).join('');
    $(id).addEventListener('click', function (e) { var t = e.target.closest('button'); if (t) setBT(+t.dataset.i); });
  });
  function setBT(i) {
    state.bti = i;
    ['atc', 'etc', 'mtc'].forEach(function (id) { $$('button', $(id)).forEach(function (b, j) { var on = j === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); });
    var b = C.bt(i); $('etk').value = b.tk; $('ecl').value = b.cl; $('erp').value = b.rep; $('emg').value = b.mg;
    est(); rdMeet();
  }

  /* ---------- tabs ---------- */
  var NAMES = ['audit', 'estimate', 'meet'];
  /* where the tool's top edge should sit, just under the sticky header; it does not depend on which panel is open */
  function toolTop() {
    var r = $('tools').getBoundingClientRect(), hd = (MG.$('hdr') || {}).offsetHeight || 68;
    return r.top < hd ? Math.max(0, window.scrollY + r.top - hd - 12) : null;
  }
  function openTool(n, scroll) {
    if (NAMES.indexOf(n) < 0) n = 'audit';
    /* move to the top of the tool first, then swap the panel: the page never jumps down to the footer when the new panel is shorter */
    var top = scroll ? toolTop() : null;
    if (top !== null) window.scrollTo({ top: top, behavior: 'instant' });
    NAMES.forEach(function (k) {
      var on = k === n, p = $('p-' + k), t = $('t-' + k);
      p.hidden = !on; p.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    });
    try { history.replaceState(null, '', location.pathname + location.search + '#' + n); } catch (e) {}
  }
  $$('[role=tab]', $('tt')).forEach(function (t) {
    t.addEventListener('click', function () { openTool(t.dataset.t, true); });
    t.addEventListener('keydown', function (e) {
      var i = NAMES.indexOf(t.dataset.t), n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : -1;
      if (n < 0) return; e.preventDefault(); n = (n + 3) % 3; openTool(NAMES[n]); $('t-' + NAMES[n]).focus();
    });
  });
  addEventListener('hashchange', function () { var n = location.hash.slice(1).replace('roi', 'estimate'); if (NAMES.indexOf(n) >= 0) openTool(n, true); });

  /* ---------- audit ---------- */
  var PER = C.PER, NI = C.ITEMS.length;
  $('al').innerHTML = C.CATS.map(function (c, ci) {
    return '<fieldset class="acat" data-c="' + ci + '"><legend><span class="acat__n">' + (ci + 1) + '</span><span class="acat__t"><b>' + esc(c) + '</b><small>' + esc(C.CAT_HINT[ci]) + '</small></span><span class="acat__c" aria-live="polite">0 of ' + PER + '</span></legend>' +
      '<div class="acat__b">' + C.ITEMS.slice(ci * PER, ci * PER + PER).map(function (x, j) { return '<label class="ck"><input type="checkbox" data-i="' + (ci * PER + j) + '"><span>' + esc(x[0]) + '</span></label>'; }).join('') + '</div>' +
      '<button type="button" class="acat__all" data-all="' + ci + '">Tick all</button></fieldset>';
  }).join('');
  function acnt() {
    var all = $$('#al input'), n = all.filter(function (c) { return c.checked; }).length;
    $('acn').textContent = n + ' of ' + NI + ' ticked'; $('acf').style.width = (n * 100 / NI) + '%';
    $$('#al .acat').forEach(function (f) {
      var bx = $$('input', f), k = bx.filter(function (c) { return c.checked; }).length;
      f.querySelector('.acat__c').textContent = k + ' of ' + bx.length; f.classList.toggle('full', k === bx.length);
      f.querySelector('.acat__all').textContent = k === bx.length ? 'Clear' : 'Tick all';
    });
  }
  $('al').addEventListener('change', acnt);
  $('al').addEventListener('click', function (e) {
    var b = e.target.closest('.acat__all'); if (!b) return;
    var f = b.closest('.acat'), bx = $$('input', f), full = bx.every(function (c) { return c.checked; });
    bx.forEach(function (c) { c.checked = !full; }); acnt();
  });
  acnt();
  function fixRow(x, i) {
    var lv = x.w >= 7 ? 'High' : x.w >= 5 ? 'Medium' : 'Low';
    return '<div class="fix"><b>' + (i + 1) + '</b><p><span class="pr ' + lv[0].toLowerCase() + '">' + lv + ' impact</span><span class="pr">' + x.e + '</span><span class="pr pr--c">' + esc(C.CATS[x.c]) + '</span><br>' + esc(x.t) + '</p></div>';
  }
  /* five-axis chart of the category scores (plain SVG, no library) */
  function radar(cs) {
    var cx = 110, cy = 108, R = 76, n = cs.length, pt = function (i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
    var ring = function (v) { return cs.map(function (c, i) { return pt(i, v).map(function (z) { return z.toFixed(1); }).join(','); }).join(' '); };
    var poly = cs.map(function (c, i) { return pt(i, Math.max(.04, c[1] / 100)).map(function (z) { return z.toFixed(1); }).join(','); }).join(' ');
    var short = ['Local SEO', 'Website', 'Social', 'Ads', 'WhatsApp'];
    return '<svg class="radar" viewBox="-30 0 280 216" role="img" aria-label="Category scores: ' + cs.map(function (c) { return c[0] + ' ' + c[1] + ' percent'; }).join(', ') + '">' +
      [.33, .66, 1].map(function (v) { return '<polygon class="rg" points="' + ring(v) + '"/>'; }).join('') +
      cs.map(function (c, i) { var p = pt(i, 1); return '<line class="rg" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; }).join('') +
      '<polygon class="rp" points="' + poly + '"/>' +
      cs.map(function (c, i) { var p = pt(i, Math.max(.04, c[1] / 100)), q = pt(i, 1.2); return '<circle class="rd" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2"/><text class="rl" x="' + q[0].toFixed(1) + '" y="' + (q[1] + 3).toFixed(1) + '" text-anchor="' + (q[0] < cx - 8 ? 'end' : q[0] > cx + 8 ? 'start' : 'middle') + '">' + short[i] + '</text>'; }).join('') + '</svg>';
  }
  var lastAudit = null;
  $('ar').addEventListener('click', function () {
    var k = $$('#al input').sort(function (a, b) { return a.dataset.i - b.dataset.i; }).map(function (c) { return c.checked; }), ao = $('aa').options[$('aa').selectedIndex], gl = $('ag').value, nm = $('an').value.trim() || 'Your business';
    var r = C.audit({ checks: k, bti: state.bti, area: ao.value, comp: $('ac').value, cur: $('ae').value }), b = r.b, s = r.s;
    var mon = lk(r.olo) + ' – ' + lk(r.ohi);
    $('ao').innerHTML =
      '<div class="mute">' + esc(nm) + ' · ' + esc(b.name) + ' · ' + esc(ao.text) + '</div>' +
      '<div class="rh"><div class="rgw"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="r0" cx="60" cy="60" r="52"/><circle class="r1" id="rr" cx="60" cy="60" r="52" stroke-dasharray="327" stroke-dashoffset="327"/></svg><b id="rs">0</b></div>' +
      '<div><div class="grd">' + r.grade + '</div><small class="mute">Goal: ' + esc(gl) + '</small><br><small class="mute">Typical local ' + esc(b.name.toLowerCase()) + ' scores about ' + r.bm + '. You are ' + (r.diff >= 0 ? r.diff + ' points above' : -r.diff + ' points below') + ' that.</small></div></div>' +
      '<p class="note2" style="margin:10px 0">Weakest area: <b>' + r.wk[0] + '</b> (' + r.wk[1] + '%). ' + r.sn + '</p>' +
      '<div class="rdx">' + radar(r.cs) + '<div class="rdx__l">' + r.cs.map(function (c) { return '<div class="cb' + (c === r.wk ? ' wk' : '') + '"><span>' + c[0] + '</span><span class="bar"><i style="width:0" data-w="' + c[1] + '"></i></span><b>' + c[1] + '%</b></div>'; }).join('') + '</div></div>' +
      (r.qw.length ? '<h3>Quick wins <small>do these this week</small></h3>' + r.qw.map(function (x, i) { return fixRow(x, i); }).join('') : '') +
      (r.bp.length ? '<h3>Bigger projects <small>plan these next</small></h3>' + r.bp.map(function (x, i) { return fixRow(x, i); }).join('') : '') +
      (!r.qw.length && !r.bp.length ? '<h3>Your top fixes</h3><p class="mute">Nothing urgent. Your next step is scaling with paid campaigns.</p>' : '') +
      '<h3>Your 30-day plan</h3><div class="tl2">' + r.plan.map(function (x) { return '<div><b>' + x[0] + '</b>' + esc(x[1]) + '</div>'; }).join('') + '</div>' +
      '<h3>Playbook for ' + esc(b.name) + '</h3><ul class="pb">' + r.tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="opp"><small>Possible monthly upside (range)</small><b>' + mon + '</b><span>about ' + r.mlo + '–' + r.mhi + ' extra enquiries a month if you close the gaps, usually visible in ' + (s < 45 ? '6–8' : '4–6') + ' weeks</span></div>' +
      '<p class="note2">Best-fit starting plan: <b>' + PLANS[r.pl].n + '</b>. Estimates use typical KDMC demand, season and competition. They are a guide, not a guarantee.</p>' +
      '<div class="cta-row noprint"><a class="btn btn--wa" id="aw" target="_blank" rel="noopener noreferrer">Send audit on WhatsApp</a><button type="button" class="btn btn--ghost" id="as">Save report</button><button type="button" class="btn btn--ghost" id="ap2">Print or save as PDF</button><button type="button" class="btn" id="am">Book a meet to review</button></div>';
    $$('#ao>*').forEach(function (e, i) { e.style.setProperty('--n', i); });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      $('rr').style.strokeDashoffset = 327 * (1 - s / 100);
      $$('#ao .bar i').forEach(function (e) { e.style.width = e.dataset.w + '%'; });
      MG.tw($('rs'), s, function (v) { return Math.round(v); }, 1100);
    }); });
    var rep = ['Free audit: ' + nm, 'Type: ' + b.name, 'Area: ' + ao.text, 'Goal: ' + gl, 'Score: ' + s + '/100 (' + r.grade + ')']
      .concat(r.cs.map(function (c) { return c[0] + ': ' + c[1] + '%'; }), ['Quick wins:'], r.qw.map(function (x, i) { return (i + 1) + '. ' + x.t; }), ['Bigger projects:'], r.bp.map(function (x, i) { return (i + 1) + '. ' + x.t; }),
        ['30-day plan:'], r.plan.map(function (x) { return x[0] + ': ' + x[1]; }),
        ['Possible upside (est.): ' + lk(r.olo) + ' to ' + lk(r.ohi) + ' a month (~' + r.mlo + '-' + r.mhi + ' enquiries)', 'Typical local score: ' + r.bm + '/100', 'Best-fit plan: ' + PLANS[r.pl].n, 'themediagraphy.in']).join('\n');
    lastAudit = rep;
    $('aw').href = wa('Namaste Mediagraphy! Here is my free audit.\n\n' + rep);
    if (okPh($('ap').value)) MG.lead('audit', { name: nm, phone: $('ap').value, area: ao.text, biz: b.name, score: s, extra: rep });
    $('as').onclick = function () { MG.save(nm.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-audit.txt', rep, $('as'), 'Save report'); };
    $('ap2').onclick = function () { window.print(); };
    $('am').onclick = function () { $('mbz').value = nm; PU.clear(); PU.add(0); rdMeet(); openTool('meet', true); };
    $('ao').scrollIntoView({ behavior: MG.reduced ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- estimator ---------- */
  var ech = 0, ecs = 1, ers = 0, LAST = '';
  function chp(id, arr, get, set) {
    $(id).innerHTML = '';
    arr.forEach(function (x, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = x[0]; b.setAttribute('aria-pressed', get() === i);
      b.onclick = function () { set(i); chp(id, arr, get, set); est(); }; $(id).appendChild(b);
    });
  }
  function est() {
    var r = C.estimate({ bti: state.bti, budget: $('eb').value, scn: ecs, chn: ech, rs: ers, season: $('esn').value, margin: $('emg').value, repeat: $('erp').value, ticket: $('etk').value, area: $('ea').value, close: $('ecl').value });
    var b = r.b, pf = r.pf, be = r.be;
    $('ebv').textContent = lk(r.bud); $('ecv').textContent = Math.round(r.cl) + '%'; $('erv').textContent = $('erp').value + '×'; $('emv').textContent = $('emg').value + '%';
    $('e1').textContent = r.elo + '–' + r.ehi; MG.tw($('e2'), r.cu, function (v) { return '~' + Math.round(v); }); MG.tw($('e3'), r.rv, lk);
    $('e4').textContent = r.cu >= .5 ? lk(r.bud / r.cu) : '-'; $('e5').textContent = (r.rv / r.inv).toFixed(1) + '×'; $('e6').textContent = be >= 0 ? 'Month ' + (be + 1) : 'After month 6'; MG.tw($('e7'), r.ltv, lk);
    $('e10').textContent = (pf < 0 ? '-' : '') + lk(Math.abs(pf)); $('e10').style.color = pf < 0 ? 'var(--bad)' : ''; $('e11').textContent = Math.max(0, Math.floor(r.cu * .7)) + '–' + Math.ceil(r.cu * 1.3);
    $$('#e8 .pc').forEach(function (p, i) { p.classList.toggle('on', i === r.pl); });
    $$('#e9 .cc').forEach(function (c, i) { var t = c.querySelectorAll('i'); t[0].style.height = Math.max(4, r.cum[i][0] / r.mx * 90) + 'px'; t[1].style.height = Math.max(4, r.cum[i][1] / r.mx * 90) + 'px'; c.title = 'Month ' + (i + 1) + ': spent ' + lk(r.cum[i][0]) + ', earned ' + lk(r.cum[i][1]); });
    LAST = ['Lead estimate: ' + b.name, 'Area: ' + $('ea').options[$('ea').selectedIndex].text, 'Channel: ' + r.ch[0] + ' (' + r.sc[0] + ' scenario)', 'Reply speed: ' + r.rs[0], 'Ad budget: ' + lk(r.bud) + ' a month',
      'Enquiries: ~' + r.elo + '-' + r.ehi, 'Customers: ~' + Math.round(r.cu), 'First-sale revenue: ' + lk(r.rv) + ' a month', 'Profit after plan + ads (at ' + $('emg').value + '% margin): ' + (pf < 0 ? '-' : '') + lk(Math.abs(pf)),
      'Return on spend: ' + (r.rv / r.inv).toFixed(1) + 'x', 'Break-even: ' + (be >= 0 ? 'month ' + (be + 1) : 'after month 6'), 'Suggested plan: ' + PLANS[r.pl].n, 'themediagraphy.in'].join('\n');
    $('ew').href = wa('Namaste Mediagraphy! Here is my lead estimate.\n\n' + LAST + '\n\nCan we talk?');
  }
  chp('ech', C.CHN, function () { return ech; }, function (i) { ech = i; });
  chp('ers', C.RS, function () { return ers; }, function (i) { ers = i; });
  chp('ecs', C.SCN, function () { return ecs; }, function (i) { ecs = i; });
  ['eb', 'ecl', 'etk', 'erp', 'emg', 'ea', 'esn'].forEach(function (i) { $(i).addEventListener('input', est); $(i).addEventListener('change', est); });
  $('ew').addEventListener('click', function () { if (okPh($('ep').value)) MG.lead('estimate', { name: '(estimate)', phone: $('ep').value, biz: BT[state.bti][0], msg: LAST }); });
  $('es2').onclick = function () { MG.save('lead-estimate.txt', LAST, $('es2'), 'Save'); if (okPh($('ep').value)) MG.lead('estimate', { name: '(estimate)', phone: $('ep').value, biz: BT[state.bti][0], msg: LAST }); };
  $('em').onclick = function () { PU.clear(); PU.add(4); rdMeet(); openTool('meet', true); };

  /* ---------- meeting ---------- */
  var MD = [], MM = ['Chai at your shop', 'Phone call', 'Video call'], MK = ['Pick an exact time', 'Choose the quietest time at my shop'],
    QW = [['Morning, 10 AM to 12 PM', 10, 0], ['Afternoon, 12 PM to 3 PM', 12, 30], ['Evening, 5 PM to 7 PM', 17, 0], ['Not sure, you suggest', 15, 0]],
    MP = ['Free audit review', 'Ads strategy', 'Website / landing page', 'Content shoot', 'Pricing & plans'], S = { d: 0, m: 0, h: 14, i: 0, k: 0, q: 3, dm: 'h' }, PU = new Set([0]);
  for (var i = 1; MD.length < 10; i++) { var dt = new Date(Date.now() + i * 864e5); if (dt.getDay()) MD.push(dt); }
  var fdt = function (d) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };
  var f12 = function (h, m) { return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
  var qh = function () { return S.k ? QW[S.q][1] : S.h; }, qm = function () { return S.k ? QW[S.q][2] : S.i; };
  var timeTxt = function () { return S.k ? 'quietest time at my shop: ' + QW[S.q][0] + ($('mq') && $('mq').value.trim() ? ' (' + $('mq').value.trim() + ')' : '') : f12(S.h, S.i); };
  var slotTxt = function () { return fdt(MD[S.d]) + ', ' + timeTxt() + ' (not confirmed)'; };
  var purTxt = function () { return Array.from(PU).sort().map(function (i) { return MP[i]; }).join(', ') || 'General discussion'; };
  function gcal() {
    var d = MD[S.d], st = new Date(d.getFullYear(), d.getMonth(), d.getDate(), qh(), qm()), en = new Date(+st + 18e5);
    var f = function (x) { return x.getFullYear() + String(x.getMonth() + 1).padStart(2, '0') + String(x.getDate()).padStart(2, '0') + 'T' + String(x.getHours()).padStart(2, '0') + String(x.getMinutes()).padStart(2, '0') + '00'; };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Tentative: strategy meet with The Mediagraphy') + '&dates=' + f(st) + '/' + f(en) +
      '&details=' + encodeURIComponent('Time not confirmed yet. We will confirm or change it with you on WhatsApp.\nTopics: ' + purTxt() + '\nMode: ' + MM[S.m]) + '&location=' + encodeURIComponent(S.m === 0 ? 'Your shop (address shared on WhatsApp)' : 'Phone / video call');
  }
  function mkc(id, arr, cur, key) { $(id).innerHTML = arr.map(function (x, i) { return '<button type="button" class="chip" ' + key + '="' + i + '" aria-pressed="' + (cur === i) + '">' + esc(String(x)) + '</button>'; }).join(''); }
  /* clock: hours 10 AM to 7 PM only, minutes in 5-minute steps (7 PM is on the hour) */
  var HRS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], hOk = function (n) { return HRS.indexOf(n) >= 0; };
  function clockHtml() {
    var hm = S.dm === 'h', pts = '', ang, n;
    for (n = 0; n < 12; n++) {
      var lab = hm ? (n || 12) : n * 5, h24 = hm ? (n < 10 && n > 7 ? -1 : (n === 0 ? 12 : n < 8 ? n + 12 : n)) : 0, ok = hm ? hOk(h24) : !(S.h === 19 && n), on = hm ? S.h === h24 : S.i === n * 5;
      var a = n * Math.PI / 6, x = 118 + 92 * Math.sin(a), y = 118 - 92 * Math.cos(a);
      pts += '<button type="button" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px" ' + (hm ? 'data-ch="' + h24 + '"' : 'data-cm="' + n * 5 + '"') + (ok ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + (hm ? lab + (h24 < 12 ? ' AM' : ' PM') : lab + ' minutes') + '">' + (hm ? lab : String(lab).padStart(2, '0')) + '</button>';
    }
    ang = hm ? ((S.h % 12) * 30) : S.i * 6;
    var hx = 118 + 70 * Math.sin(ang * Math.PI / 180), hy = 118 - 70 * Math.cos(ang * Math.PI / 180);
    return '<div class="clk"><div class="clk__r" role="group" aria-label="Selected time"><button type="button" class="t" data-dm="h" aria-pressed="' + hm + '" aria-label="Hour, ' + ((S.h + 11) % 12 + 1) + '">' + ((S.h + 11) % 12 + 1) + '</button><b aria-hidden="true">:</b><button type="button" class="t" data-dm="m" aria-pressed="' + !hm + '" aria-label="Minutes, ' + String(S.i).padStart(2, '0') + '">' + String(S.i).padStart(2, '0') + '</button><span class="clk__am" aria-hidden="true">' + (S.h < 12 ? 'AM' : 'PM') + '</span></div>' +
      '<div class="clk__f"><svg viewBox="0 0 236 236" aria-hidden="true"><line x1="118" y1="118" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '"/><circle cx="118" cy="118" r="4"/></svg>' + pts + '</div>' +
      '<p class="clk__hint">' + (hm ? 'Tap the hour (10 AM to 7 PM)' : 'Now tap the minutes') + '</p></div>';
  }
  function quietHtml() {
    return '<div class="quiet"><p class="clk__hint" style="text-align:left;max-width:none;margin-bottom:10px">Tell us when your shop is least crowded and we will plan around it, so customers are not left waiting while we talk.</p><div class="chips" id="mqw" role="group" aria-label="Quietest time">' + QW.map(function (x, i) { return '<button type="button" class="chip" data-q="' + i + '" aria-pressed="' + (S.q === i) + '">' + x[0] + '</button>'; }).join('') + '</div><div class="field" style="margin-top:12px"><label for="mq">Your exact quiet hours <small>(optional)</small></label><input type="text" id="mq" maxlength="60" placeholder="e.g. 3 to 4 PM, after lunch rush" value="' + esc($('mq') ? $('mq').value : '') + '"></div></div>';
  }
  function rdMeet(keep) {
    mkc('md', MD.map(fdt), S.d, 'data-d'); mkc('mm', MM, S.m, 'data-m'); mkc('mk', MK, S.k, 'data-k');
    if (!keep) $('mt').innerHTML = S.k ? quietHtml() : clockHtml();
    $('mpu').innerHTML = MP.map(function (p, i) { return '<button type="button" class="chip" data-p="' + i + '" aria-pressed="' + PU.has(i) + '">' + p + '</button>'; }).join('');
    var plan = state.plan;
    $('msum').innerHTML = '<div><small>When (to be confirmed)</small><b>' + esc(fdt(MD[S.d]) + ', ' + (S.k ? QW[S.q][0] : f12(S.h, S.i))) + '</b></div><div><small>How</small><b>' + MM[S.m] + '</b></div><div><small>Topic</small><b>' + esc(purTxt() + (plan ? ' · ' + plan : '')) + '</b></div><div><small>For</small><b>' + esc(BT[state.bti][0]) + '</b></div>';
    $('mc').href = wa('Namaste Mediagraphy! I would like to book a strategy meet.\nName: ' + ($('mn').value || '-') + '\nBusiness: ' + ($('mbz').value || '-') + ' (' + BT[state.bti][0] + ')\nPreferred day and time: ' + slotTxt() + '\nPlease confirm or suggest another time here on WhatsApp.\nHow: ' + MM[S.m] + '\nTopics: ' + purTxt() + (plan ? '\nInterested plan: ' + plan : ''));
    $('mgc').href = gcal();
  }
  function refocus(sel) { var e = document.querySelector(sel); if (e && !e.disabled) e.focus({ preventScroll: true }); }
  $('mk').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.k = +b.dataset.k; rdMeet(); refocus('#mk [data-k="' + S.k + '"]'); } });
  $('mt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.dm) { S.dm = b.dataset.dm; rdMeet(); refocus('#mt [data-dm="' + S.dm + '"]'); }
    else if (b.dataset.ch) { S.h = +b.dataset.ch; if (S.h === 19) S.i = 0; S.dm = 'm'; rdMeet(); refocus('#mt [data-cm="' + S.i + '"]'); }
    else if (b.dataset.cm) { S.i = +b.dataset.cm; rdMeet(); refocus('#mt [data-cm="' + S.i + '"]'); }
    else if (b.dataset.q) { S.q = +b.dataset.q; rdMeet(); refocus('#mt [data-q="' + S.q + '"]'); }
  });
  $('mt').addEventListener('input', function () { rdMeet(true); });
  $('md').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.d = +b.dataset.d; rdMeet(); } });
  $('mm').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { S.m = +b.dataset.m; rdMeet(); } });
  $('mpu').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { var i = +b.dataset.p; PU.has(i) ? PU.delete(i) : PU.add(i); rdMeet(); } });
  ['mn', 'mbz'].forEach(function (id) { $(id).addEventListener('input', rdMeet); });
  $('mc').addEventListener('click', function () { if ($('mn').value || $('mp').value) MG.lead('whatsapp-meet', { name: $('mn').value, phone: $('mp').value, biz: $('mbz').value, btype: BT[state.bti][0], slot: slotTxt(), mode: MM[S.m], confirmed: false, msg: purTxt() + (state.plan ? ' | Plan: ' + state.plan : '') }); });
  (function () {
    var o = MG.isOpen();
    $('lt').textContent = o ? 'Team online now · Mon–Sat, 10 AM–7 PM' : 'Team offline · WhatsApp us, we reply first thing'; if (!o) $('ld').classList.add('off');
  })();

  /* ---------- start-up: business type, plan and tab from the URL ---------- */
  var tq = Q.get('t'), ti = 0;
  if (tq != null) { var f = BT.findIndex(function (b) { return b[1] === tq; }); if (f >= 0) ti = f; }
  var pq = Q.get('plan');
  if (pq) { var pp = PLANS.find(function (p) { return p.slug === pq; }); state.plan = pp ? pp.n : (pq === 'custom' ? 'Custom plan' : ''); if (state.plan) { PU.clear(); PU.add(4); } }
  var bq = +Q.get('b'); if (bq >= 5000 && bq <= 200000) $('eb').value = bq;
  setBT(ti);
  var h0 = location.hash.slice(1).replace('roi', 'estimate');
  openTool(NAMES.indexOf(h0) >= 0 ? h0 : (pq ? 'meet' : 'audit'));
  })();
