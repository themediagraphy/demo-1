/* ==========================================================================
   Site settings. Edit this file, then commit. No rebuild is needed.
   ========================================================================== */
window.MG_CONFIG = {
  /* GST: the studio is not registered, so GST is NOT charged or shown.
     When the business is registered for GST, set gstRegistered to true.
     Prices then show "+ 18% GST" and the estimator adds GST to plan fees. */
  gstRegistered: false,
  gstRate: 18,

  /* Optional: paste your Google Apps Script web-app URL to save every audit,
     estimate and call-back request into a Google Sheet. See leads-apps-script.gs.
     Leave empty to use WhatsApp and email only (nothing is stored). */
  leadUrl: '',

  /* Optional: count taps on WhatsApp, Call, Email and the main buttons (only the name of the tap and the page, no names, numbers or cookies).
     It needs leadUrl above. Leave false unless you also add a line about it to the Privacy Policy, which at present says the site has no analytics. */
  trackEvents: false,

  whatsapp: '918637744905',
  phone: '+91 86377 44905',
  email: 'growth@themediagraphy.in',
  hours: { days: [1, 2, 3, 4, 5, 6], open: 10, close: 19 }   /* Monday to Saturday, 10 AM to 7 PM */
};
