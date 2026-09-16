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

// Same decided-once-at-load contract as DRAWER_MODE (see CLAUDE.md: a resize after load does
// not change mode, a reload does). Phone gets its own centered-modal card behavior inside
// initSkillsWall() below; reduced-motion desktop and a failed drawer import still fall back to
// the plain full-width wall untouched.
const IS_PHONE_SKILLS_LAYOUT = window.matchMedia('(max-width: 700px)').matches;

function initSkillsWall() {
  if (!skillsSection || !skillTiles.length) return;
  // The invitation, in the same place the hero puts its own "click on an object" line -
  // except on phone, where it's replaced by .skills-invite (below): that one sits beside
  // the stack itself and stays in view the whole way down, instead of scrolling away
  // above a 22-tool list the way this one would. Reduced-motion desktop and a failed
  // drawer import still use the plain grid with no side panel to carry it instead, so they
  // keep this one.
  if (!IS_PHONE_SKILLS_LAYOUT) {
    const hint = document.createElement('p');
    hint.className = 'skills-hint';
    hint.textContent =
      content.skillsHint?.text ?? 'Click any tool to see what I actually do with it.';
    skillsSection.querySelector('h2')?.after(hint);
  }

  const card = document.createElement('div');
  card.className = 'skill-card';
  const inner = buildSkillCardInner();
  card.append(inner);

  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phone: the stack takes the left half and the card opens fixed in the right half,
  // beside it. Nothing is covered, so this is a non-modal dialog - no aria-modal, no
  // inert, no scroll lock: the page keeps scrolling and every tab stays tappable.
  let modalEl = null;
  let stripEl = null;
  let invite = null;
  if (IS_PHONE_SKILLS_LAYOUT) {
    modalEl = document.createElement('div');
    modalEl.className = 'skills-modal';
    document.body.append(modalEl);
    // the tab stack itself, which ends with the last tab - the section around it carries
    // padding the panel has no business sitting beside
    stripEl = document.querySelector('.drawer__strip');
    inner.querySelector('.skill-card__title').id = 'skill-card-title';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'skill-card-title');

    // The same invitation the section's own heading already carries, repeated into the
    // empty half of the frame the stack doesn't use - the only thing living there until a
    // tap fills it with an actual card. Lives in the fixed .skills-modal, sharing the
    // card's own grid cell (place-items: center end already centres it on the viewport,
    // not on the stack's own - much taller - height, so it stays put on screen as the
    // stack scrolls under it, instead of only ever showing up around the drawer's
    // midpoint). Visibility is wired up below, alongside the card's own placement logic -
    // it needs the exact same "does this fit beside the stack" test the card uses.
    invite = document.createElement('p');
    invite.className = 'skills-invite';
    // Two explicit rows, not the natural wrap: the shine is one background image per
    // element, so text that wraps within a single element shows the same slice of the
    // gradient on every line at once - same colour, same instant, no stagger possible.
    // Split into two <span>, each its own element with its own hint-shine timeline
    // (offset in CSS via animation-delay), so the second visibly trails the first instead
    // of moving in lockstep with it.
    const text = content.skillsHint?.text ?? 'Click any tool to see what I actually do with it.';
    const words = text.split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = document.createElement('span');
    line1.className = 'skills-invite__line';
    line1.textContent = words.slice(0, mid).join(' ');
    const line2 = document.createElement('span');
    line2.className = 'skills-invite__line';
    line2.textContent = words.slice(mid).join(' ');
    invite.append(line1, line2);
    modalEl.append(invite);
  }

  const applyContent = (li) => {
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!applySkillContent(inner, d)) return false;
    card.style.setProperty('--brand', d.color);
    return true;
  };

  let activeEl = null;

  // where a fixed, centred-on-the-frame element lands, as tall as it needs - shared by the
  // open card and, further down, the idle invitation that shows in its place
  const bandFor = (el) => {
    const h = el.offsetHeight; // layout box: unaffected by any entry transform
    const top = (window.innerHeight - h) / 2;
    return { top, bottom: top + h };
  };

  // Either one may only live alongside the stack itself. Past the bottom it hangs over
  // Projects; past the top it drifts up beside the section's own title, with no tab next
  // to it at all. The stack, not the section around it: the section's padding reaches
  // well past the last tab, which is exactly the slack that let it overlap.
  const fitsBesideStack = (el) => {
    if (!stripEl) return true;
    const strip = stripEl.getBoundingClientRect();
    const band = bandFor(el);
    return band.top >= strip.top && band.bottom <= strip.bottom;
  };

  // Opening a tab near either end of the stack centres the panel past that end - tap the
  // last tab with Projects already filling the screen and the card opens on top of
  // Projects. This walks the page the minimum distance that puts the panel back alongside
  // actual tabs, landing it a few px inside so that rounding alone cannot trip the close
  // test above on the very next scroll event.
  const STACK_PAD = 8;
  let scrollSettleUntil = 0;
  const scrollPanelBesideStack = () => {
    if (!stripEl) return;
    const strip = stripEl.getBoundingClientRect();
    const panel = bandFor(card);

    // a positive scroll moves the page down, which moves the strip up the frame
    let delta = 0;
    if (panel.bottom > strip.bottom - STACK_PAD) delta = strip.bottom - STACK_PAD - panel.bottom;
    else if (panel.top < strip.top + STACK_PAD) delta = strip.top + STACK_PAD - panel.top;
    if (!delta) return;

    // the scroll below fires scroll events of its own, and mid-flight the panel is briefly
    // outside the section - without this the close-on-scroll watcher would shut the card
    // we are in the middle of placing
    scrollSettleUntil = performance.now() + (isReduced() ? 0 : 800);
    window.scrollBy({ top: delta, behavior: isReduced() ? 'auto' : 'smooth' });
  };

  const closeCard = (instant) => {
    if (!activeEl) return;
    activeEl.classList.remove('is-active');
    activeEl = null;
    skillsSection.classList.remove('is-focused');
    card.closest('.skill-group')?.classList.remove('has-open-card');

    if (IS_PHONE_SKILLS_LAYOUT) {
      modalEl.classList.remove('is-open');
      if (instant || isReduced()) {
        card.remove();
        return;
      }
      modalEl.addEventListener('transitionend', () => card.remove(), { once: true });
      return;
    }

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
    if (IS_PHONE_SKILLS_LAYOUT) {
      if (!applyContent(li)) return;
      activeEl?.classList.remove('is-active');
      activeEl = li;
      li.classList.add('is-active');
      gsap.killTweensOf(card);
      modalEl.append(card);
      // rAF so the just-inserted node still picks up the CSS transition instead of
      // starting already in its end state. Focus stays on the tab that was tapped: the
      // panel covers nothing, so pulling focus across the frame would only cost the
      // reader their place in the stack.
      // Guarded: a close landing inside the same frame (Escape on a keyboard, a scripted
      // open/close) would otherwise be undone by this callback re-opening the panel.
      requestAnimationFrame(() => {
        if (activeEl !== li) return;
        modalEl.classList.add('is-open');
        scrollPanelBesideStack();
      });
      return;
    }

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
      // 0.35, not the 0.55 this shipped with: this is the answer to a tap, and it animates
      // height, which relayouts - the shorter it runs, the less of that there is to drop
      { height: 'auto', opacity: 1, duration: 0.35, ease: 'power3.out' },
    );
    gsap.fromTo(
      inner,
      { y: movingRow ? 18 : 8, opacity: movingRow ? 0 : 0.4 },
      {
        y: 0,
        opacity: 1,
        // kept just inside the card's own 0.35 so the two still land together
        duration: movingRow ? 0.35 : 0.28,
        delay: movingRow ? 0.06 : 0,
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
    // captured before closeCard() clears activeEl
    const target = activeEl;
    closeCard();
    target?.focus();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeEl) {
      const target = activeEl;
      closeCard();
      target.focus();
    }
  });
  // The panel is fixed, so scrolling slides the stack out from under it and it ends up
  // hanging over a neighbouring section. It closes the moment it stops fitting beside the
  // stack - the same test that placed it, so the two can never disagree. Only ever closes:
  // opening still needs a real tap (see CLAUDE.md - a scroll-driven open burns the gesture
  // before the reader has looked at anything).
  //
  // The idle invitation rides the same listener and the same test: an IntersectionObserver
  // (the earlier approach) only asks whether the strip has any pixel at all in the
  // viewport, which stayed true long after the invite's own centred band - a fixed height
  // in the middle of the screen - had already scrolled past the strip's actual edge and
  // onto Projects or the section's own title.
  if (IS_PHONE_SKILLS_LAYOUT) {
    const syncPlacement = () => {
      if (activeEl) {
        if (performance.now() >= scrollSettleUntil && !fitsBesideStack(card)) closeCard();
      } else if (invite) {
        invite.classList.toggle('is-visible', fitsBesideStack(invite));
      }
    };
    window.addEventListener('scroll', syncPlacement, { passive: true });
    syncPlacement();
  }

  // clicking away from the wall closes it; the card and the tiles handle their own clicks
  window.addEventListener('click', (e) => {
    if (!activeEl || card.contains(e.target) || e.target.closest('.skills-grid li')) return;
    closeCard();
  });
}

// the DJ set player — lazy, and mounted on #skill-drawer in *both* modes. That element is
// in the markup either way: with the metal live it is the positioned box the player parks
// in the corner of, and without it a plain wrapper the player falls into the flow of. So
// there is one mount point, one DOM, and no branch here beyond when to call this.
const skillDrawerEl = document.querySelector('#skill-drawer');
const mountSets = () => {
  if (!skillDrawerEl) return; // every page but the home page
  import('./setPlayer.js').then((m) => m.initSetPlayer(skillDrawerEl));
};

if (!DRAWER_MODE) {
  initSkillsWall();
  // no DJ player on the phone modal layout - see IS_PHONE_SKILLS_LAYOUT above
  if (!IS_PHONE_SKILLS_LAYOUT) mountSets();
}

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
  const skillDrawer = skillDrawerEl;
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
      // after is-live: the player's own CSS is scoped to it, and mounting first would flash
      // the flow-layout variant for a frame
      mountSets();
    })
    // the metal failed, so hand the section back to the wall it would have replaced
    .catch(() => {
      initSkillsWall();
      if (!IS_PHONE_SKILLS_LAYOUT) mountSets();
    });
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
