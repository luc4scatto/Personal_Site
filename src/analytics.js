const GA_ID = 'G-VQZPYCK9R0';
const CONSENT_KEY = 'cookie-consent';

function loadGA() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

// GDPR: nothing loads until the visitor accepts. Choice is remembered in
// localStorage so the banner only ever shows once per browser.
export function initAnalytics() {
  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'granted') {
    loadGA();
    return;
  }
  if (consent === 'denied') return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML =
    "<p>This site uses Google Analytics to see how it's used. No data is sold or shared. " +
    '<a href="privacy.html" aria-label="Learn more in the privacy policy">Learn more</a></p>' +
    '<div class="cookie-banner__actions">' +
    '<button type="button" class="cookie-banner__decline">Decline</button>' +
    '<button type="button" class="btn cookie-banner__accept">Accept</button>' +
    '</div>';
  document.body.appendChild(banner);

  banner.querySelector('.cookie-banner__accept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    loadGA();
    banner.remove();
  });
  banner.querySelector('.cookie-banner__decline').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    banner.remove();
  });
}
