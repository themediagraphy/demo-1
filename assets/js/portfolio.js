/* portfolio.js: opens the sample-work folder inside the page, only after the visitor presses the button.
   Nothing from Google loads before that, so the rest of the site stays free of third-party content.
   If the browser, a network filter or a host policy refuses to show the embedded folder, the visitor gets a clear
   message with two ways forward instead of a raw browser error. */
(function () {
  'use strict';
  var box = document.querySelector('[data-pf]');
  if (!box) return;
  var btn = box.querySelector('[data-pf-open]'), stage = box.querySelector('.pf__stage');
  var id = box.getAttribute('data-pf-id') || '';
  if (!btn || !stage || !/^[A-Za-z0-9_-]{10,80}$/.test(id)) return;

  var frame = null, live = null, failed = false;

  function say(t) { if (live) live.textContent = t; }

  /* Show the placeholder card again with a message that says what happened and what to do next. */
  function fail() {
    if (failed) return;
    failed = true;
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = null;
    box.classList.remove('is-open');
    var msg = box.querySelector('.pf__msg');
    if (msg) {
      var h = msg.querySelector('h2'), p = msg.querySelector('p');
      if (h) h.textContent = 'The samples could not open on this page';
      if (p) p.textContent = 'Your browser or network did not allow the folder to show here. You can open the samples in a new tab, or message us on WhatsApp and we will send them to you.';
      var a = document.createElement('a');
      a.className = 'btn btn--lg';
      a.href = 'https://drive.google.com/drive/folders/' + encodeURIComponent(id);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open in a new tab';
      btn.parentNode.replaceChild(a, btn);
      btn = null;
    }
    say('The portfolio samples could not be shown on this page.');
  }

  /* The browser reports a blocked frame as a CSP violation on the page. */
  document.addEventListener('securitypolicyviolation', function (e) {
    if (!frame) return;
    var d = e.effectiveDirective || e.violatedDirective || '';
    if (/^(frame|child)-src/.test(d)) fail();
  });

  function open() {
    if (box.classList.contains('is-open') || failed) return;
    box.classList.add('is-open');
    var f = document.createElement('iframe');
    frame = f;
    f.className = 'pf__f';
    f.title = 'Portfolio samples';
    f.src = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(id) + '#grid';
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    stage.appendChild(f);
    live = document.createElement('p');
    live.className = 'sr';
    live.setAttribute('role', 'status');
    live.textContent = 'Portfolio samples are loading below.';
    box.appendChild(live);
    try { f.focus({ preventScroll: true }); } catch (e) {}
    try { box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } catch (e) {}
  }
  btn.addEventListener('click', open);
})();
