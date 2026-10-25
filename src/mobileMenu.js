import { content } from './content.js';

// Phone menu: a burger left of the logo that opens every page of the site in a native modal
// <dialog> (focus trap, Escape and the inert page behind come with it). Built once, inside
// .nav but outside the parts src/router.js swaps, so it survives in-place page changes.
// CSS shows it only under 700px; above that the button and dialog stay hidden.
const SECTIONS = [
  ['About', '/#about'],
  ['Skills', '/#skills'],
  ['Projects', '/#projects'],
];

// the same ways to reach out as the home page's Contact section
const CONTACT = [
  ['Write to me', '/#contact'],
  ['GitHub', 'https://github.com/luc4scatto'],
  ['LinkedIn', 'https://www.linkedin.com/in/lucascattolin'],
  ['CV (PDF)', '/cv/Luca-Scattolin-CV.pdf'],
];

const PROJECTS = [
  ['vivatech', '/vivatech.html'],
  ['pipeline', '/pipeline-projects.html'],
  ['companyBrain', '/company-brain.html'],
  ['three', '/homelab.html'],
];

const ICON = (d) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="${d}" /></svg>`;

function linkList(label, items) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', label);
  const heading = document.createElement('p');
  heading.className = 'mobile-menu__label';
  heading.textContent = label;
  const list = document.createElement('ul');
  items.forEach(([text, href]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (a.origin !== location.origin) {
      a.target = '_blank';
      a.rel = 'noopener';
      a.insertAdjacentHTML('beforeend', ' <span aria-hidden="true">↗&#xFE0E;</span>');
    }
    li.append(a);
    list.append(li);
  });
  nav.append(heading, list);
  return nav;
}

export function initMobileMenu() {
  const header = document.querySelector('.nav');
  if (!header) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-burger';
  button.setAttribute('aria-label', 'Menu');
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'mobile-menu');
  button.innerHTML = ICON('M4 7h16M4 12h16M4 17h16');

  const dialog = document.createElement('dialog');
  dialog.id = 'mobile-menu';
  dialog.className = 'mobile-menu';
  dialog.setAttribute('aria-label', 'Site menu');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'mobile-menu__close';
  close.setAttribute('aria-label', 'Close menu');
  close.innerHTML = ICON('M6 6l12 12M18 6L6 18');

  const projects = PROJECTS.map(([key, href]) => [content.projects[key]?.title ?? key, href]);
  dialog.append(
    close,
    linkList('Home', SECTIONS),
    linkList('Projects', projects),
    linkList('Contact', CONTACT),
  );
  dialog.querySelector('a[href$=".pdf"]').setAttribute('download', '');

  header.prepend(button);
  document.body.append(dialog);

  button.addEventListener('click', () => {
    // the page may have changed in place since the last open (src/router.js)
    dialog.querySelectorAll('a').forEach((a) => {
      if (a.pathname === location.pathname && !a.hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  // a link (an anchor on this page or another page) or a tap on the backdrop closes it
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target === dialog) dialog.close();
  });
}
