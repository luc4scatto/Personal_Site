import gsap from 'gsap';
import './styles/base.css';
import './styles/sections.css';
import { initAnimations, refreshScrollTriggers } from './animations.js';
import { initAnalytics } from './analytics.js';
import { content } from './content.js';
import { buildSkillCardInner, applySkillContent } from './skillCard.js';

// content.js copy is developer-authored, not user input, so **bold** markup is safe to allow
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// fill every [data-copy="a.b.c"] element from content.js — runs before any animation
// so GSAP only ever sees the final text, never a swap mid-reveal
document.querySelectorAll('[data-copy]').forEach((el) => {
  const value = el.dataset.copy.split('.').reduce((o, k) => o?.[k], content);
  if (typeof value !== 'string') return;
  el.innerHTML = value.split('\n').map(escapeHtml).join('<br>');
});
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const status = contactForm.querySelector('.contact-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    status.textContent = 'Sending...';
    try {
      const res = await fetch(content.contact.formEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm),
      });
      if (res.ok) {
        status.textContent = "Thanks! I'll get back to you soon.";
        contactForm.reset();
      } else {
        status.textContent = 'Something went wrong - please try again.';
      }
    } catch {
      status.textContent = 'Something went wrong - please try again.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// marquee band — duplicate the word list once for the seamless CSS loop
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack) {
  const words = content.marquee.words;
  marqueeTrack.innerHTML = [...words, ...words]
    .map((w) => `<span>${escapeHtml(w)}</span>`)
    .join('');
}

// arriving with a hash already in the URL (e.g. a project sub-page's footer Contact link)
// the browser's native fragment scroll fires against the pre-JS layout, before the
// [data-copy] substitutions above resize everything below the hero — so it lands short.
// Re-scroll once the page (images included, now all sized) has finished loading.
if (location.hash) {
  const hashTarget = document.querySelector(location.hash);
  if (hashTarget) {
    window.addEventListener('load', () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => hashTarget.scrollIntoView({ block: 'start' })),
      );
    });
  }
}

// highlight the nav link of the section currently in view
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav nav a');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
    });
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
sections.forEach((s) => observer.observe(s));

initAnimations();
initAnalytics();

// vivatech gallery: reveal each image as it scrolls into view. A plain
// IntersectionObserver rather than the GSAP data-reveal system the rest of the site
// uses, so this is self-contained and keeps working correctly if the gallery ever ends
// up above something else whose own size resolves asynchronously (a video's real
// dimensions, another lazy image) — a scroll-position calculation taken before that
// settles reads the whole page at the wrong offset, whereas the live browser-native
// intersection check here just re-evaluates once things do.
// Hidden state lives on .gallery.is-observed, added only once JS confirms it can reveal
// them — without it (or with prefers-reduced-motion) the images are just there, visible,
// which is the correct no-JS/no-motion fallback rather than stuck invisible.
const gallery = document.querySelector('.gallery');
if (gallery && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gallery.classList.add('is-observed');
  const revealImage = (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  };
  const galleryObserver = new IntersectionObserver(revealImage, { rootMargin: '0px 0px -10% 0px' });
  // CSS multi-column balances its columns' heights across two layout passes — an
  // estimate, then a correction once every image's aspect-ratio has actually resolved.
  // Observing on the estimate meant a couple of images could sit inside the viewport
  // for that one transitional frame and permanently unobserve themselves as "revealed"
  // long before they scroll anywhere near it. A frame of slack lets it settle first.
  requestAnimationFrame(() => {
    gallery.querySelectorAll('img').forEach((img) => galleryObserver.observe(img));
  });
}

// card spotlight: radial glow following the pointer
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// skills wall: every tool is a tile carrying its own brand mark and color. Picking one
// blurs the rest of the wall and unfolds its card in place, inside the category it belongs
// to — the same "focus one thing, let the rest recede" grammar as the 3D hero cloud.
// Copy lives in src/content.js.
const SKILL_DESCRIPTIONS = content.skills;

const skillsSection = document.querySelector('.skills');
const skillTiles = document.querySelectorAll('.skills-grid li[data-skill]');

// The drawer takes the section over completely when it can run: it turns each folder into
// its own detail card, so the flat wall's tile-and-card wiring must not also bind. Decided
// synchronously, before the dynamic import, so there is never a window with both live.
const DRAWER_MODE =
  !!document.querySelector('#skill-drawer') &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  window.matchMedia('(min-width: 701px)').matches;

function initSkillsWall() {
  if (!skillsSection || !skillTiles.length) return;
  // the invitation, in the same place the hero puts its own "click on an object" line
  const hint = document.createElement('p');
  hint.className = 'skills-hint';
  hint.textContent =
    content.skillsHint?.text ?? 'Click any tool to see what I actually do with it.';
  skillsSection.querySelector('h2')?.after(hint);

  const card = document.createElement('div');
  card.className = 'skill-card';
  const inner = buildSkillCardInner();
  card.append(inner);

  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyContent = (li) => {
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!applySkillContent(inner, d)) return false;
    card.style.setProperty('--brand', d.color);
    return true;
  };

  let activeEl = null;

  const closeCard = (instant) => {
    if (!activeEl) return;
    activeEl.classList.remove('is-active');
    activeEl = null;
    skillsSection.classList.remove('is-focused');
    card.closest('.skill-group')?.classList.remove('has-open-card');
    gsap.killTweensOf(card);
    if (instant || isReduced()) {
      card.remove();
      return;
    }
    gsap.to(card, {
      height: 0,
      opacity: 0,
      duration: 0.32,
      // exits read as responsive starting fast, same as entrances — power2.in delayed the
      // moment the card actually started collapsing, right when the click expects a reaction
      ease: 'power2.out',
      onComplete: () => card.remove(),
    });
  };

  const openCard = (li) => {
    const grid = li.closest('.skills-grid');
    if (!applyContent(li) || !grid) return;
    // In drawer mode the folders sit in one horizontal row, so there is no row for the card
    // to unfold inside: it opens in a slot below the drawer instead. With no slot (the
    // mobile / no-WebGL wall) it still unfolds under the category that owns the pick.
    const mount = document.querySelector('#skill-card-slot') || grid;
    const movingRow = card.parentElement !== mount;

    activeEl?.classList.remove('is-active');
    activeEl = li;
    li.classList.add('is-active');
    skillsSection.classList.add('is-focused');
    document.querySelectorAll('.has-open-card').forEach((g) => g.classList.remove('has-open-card'));
    li.closest('.skill-group')?.classList.add('has-open-card');

    // the card is a grid item spanning the row, appended to the category that owns the
    // pick — so it always unfolds under the tool, never somewhere else on the wall
    gsap.killTweensOf(card);
    gsap.killTweensOf(inner);
    mount.append(card);
    if (isReduced()) {
      gsap.set(card, { height: 'auto', opacity: 1 });
      gsap.set(inner, { y: 0, opacity: 1 });
      return;
    }
    // switching within a row is a content swap, not a second unfold: only the height
    // re-measures. Landing in a new row unfolds from nothing.
    gsap.fromTo(
      card,
      { height: movingRow ? 0 : card.offsetHeight, opacity: movingRow ? 0 : 1 },
      { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out' },
    );
    gsap.fromTo(
      inner,
      { y: movingRow ? 18 : 8, opacity: movingRow ? 0 : 0.4 },
      {
        y: 0,
        opacity: 1,
        duration: movingRow ? 0.5 : 0.32,
        delay: movingRow ? 0.08 : 0,
        ease: 'power3.out',
      },
    );
  };

  skillTiles.forEach((li) => {
    // the tiles are <li>, so keyboard access has to be granted explicitly
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    // each tile carries its own brand color; CSS washes the tile and the open card with it
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (d) li.style.setProperty('--brand', d.color);

    const toggle = () => (activeEl === li ? closeCard() : openCard(li));
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Space would scroll the page
      toggle();
    });
  });

  card.querySelector('.skill-card__close').addEventListener('click', () => {
    activeEl?.focus(); // send focus back to the tile that opened the card
    closeCard();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeEl) {
      activeEl.focus();
      closeCard();
    }
  });
  // clicking away from the wall closes it; the card and the tiles handle their own clicks
  window.addEventListener('click', (e) => {
    if (!activeEl || card.contains(e.target) || e.target.closest('.skills-grid li')) return;
    closeCard();
  });
}

if (!DRAWER_MODE) initSkillsWall();

// floating 3D hobby icons — lazy, respects reduced motion
const heroCanvas = document.querySelector('#hero-canvas');
if (heroCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('./hero3d.js').then((m) => {
    m.initHero3D(heroCanvas);
    // the "click the objects" hint only makes sense once the 3D scene exists
    const hint = document.querySelector('.hero-hint');
    if (hint) hint.hidden = false;
  });
}

// the skill drawer's metal shell — lazy, same gate as the hero: under reduced motion the
// three.js chunk is never fetched and the section falls back to the flat wall
// below 701px a perspective drawer is unreadable, so the chunk is not even fetched there
if (DRAWER_MODE) {
  const skillDrawer = document.querySelector('#skill-drawer');
  const scene = skillDrawer.querySelector('.drawer__scene');
  const strip = skillDrawer.querySelector('.drawer__strip');
  import('./skillDrawer.js')
    .then((m) => {
      m.initSkillDrawer(scene, strip);
      // only claim the drawer once the metal is actually there; CSS keys the whole layout
      // off this class
      skillDrawer.classList.add('is-live');
      // .is-live swaps the flat .drawer__strip grid (tall) for the drawer's own much
      // shorter aspect-ratio box — every ScrollTrigger below this point (Projects' h2 clip
      // reveal, its [data-reveal] cards, Contact) was measured against the taller layout a
      // moment ago in initAnimations() and is now stale, firing at pixel offsets well past
      // where those sections actually sit. See refreshScrollTriggers() in animations.js.
      refreshScrollTriggers();
    })
    // the metal failed, so hand the section back to the wall it would have replaced
    .catch(() => initSkillsWall());
}

// homelab network diagram (homelab.html only) — real content, always renders;
// only the connection-line pulse is gated by reduced-motion, in CSS
const homelabDiagram = document.querySelector('#homelab-diagram');
if (homelabDiagram) {
  import('./homelabDiagram.js').then((m) => m.initHomelabDiagram(homelabDiagram));
}

// homelab hardware diagram (homelab.html only) — same reasoning as above
const homelabHardware = document.querySelector('#homelab-hardware');
if (homelabHardware) {
  import('./homelabHardware.js').then((m) => m.initHomelabHardware(homelabHardware));
}
