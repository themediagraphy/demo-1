/* track.js: optional, privacy-light tap counting. It does nothing unless config.js turns it on AND a leadUrl is set.
   It records only the name of the tap (whatsapp, call, email, audit-start...) and the page path. No names, numbers, cookies or IDs. */
(function () {
  'use strict';
  var MG = window.MG || {}, CFG = window.MG_CONFIG || {};
  if (!CFG.trackEvents || !MG.lead) return;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button'); if (!a) return;
    var ev = a.getAttribute('data-ev');
    if (!ev) {
      var h = a.getAttribute('href') || '';
      if (/^https:\/\/wa\.me\//.test(h)) ev = 'whatsapp'; else if (/^tel:/.test(h)) ev = 'call'; else if (/^mailto:/.test(h)) ev = 'email'; else return;
    }
    MG.lead('event', { event: ev, label: location.pathname });
  }, true);
})();
