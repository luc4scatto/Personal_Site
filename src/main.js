import gsap from 'gsap';
import './styles/base.css';
import './styles/sections.css';
import { initAnimations } from './animations.js';
import { content } from './content.js';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// fill every [data-copy="a.b.c"] element from content.js — runs before any animation
// so GSAP only ever sees the final text, never a swap mid-reveal
document.querySelectorAll('[data-copy]').forEach((el) => {
  const value = el.dataset.copy.split('.').reduce((o, k) => o?.[k], content);
  if (typeof value !== 'string') return;
  el.innerHTML = value.split('\n').map(escapeHtml).join('<br>');
});
const emailLink = document.querySelector('[data-copy="contact.email"]');
if (emailLink) emailLink.href = `mailto:${content.contact.email}`;

// marquee band — duplicate the word list once for the seamless CSS loop
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack) {
  const words = content.marquee.words;
  marqueeTrack.innerHTML = [...words, ...words].map((w) => `<span>${escapeHtml(w)}</span>`).join('');
}

// highlight the nav link of the section currently in view
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav nav a');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) =>
        a.classList.toggle('active', a.hash === `#${entry.target.id}`)
      );
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((s) => observer.observe(s));

initAnimations();

// card spotlight: radial glow following the pointer
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// skill pills → detail card in the sticky column beside the grid (copy lives in
// src/content.js). Hovering or focusing a pill previews its card; clicking locks it.
const SKILL_DESCRIPTIONS = content.skills;

const skillPills = document.querySelectorAll('.skills-grid li[data-skill]');
const skillDetail = document.querySelector('.skill-detail');
if (skillPills.length && skillDetail) {
  const backdrop = document.createElement('div');
  backdrop.className = 'skill-panel-backdrop';
  const panel = document.createElement('div');
  panel.className = 'skill-panel';
  // everything that changes per skill sits in one wrapper, so a hover preview can
  // crossfade the whole block with a single class instead of four separate fades
  panel.innerHTML =
    '<button class="skill-panel__close" aria-label="Close">&times;</button>' +
    '<div class="skill-panel__body">' +
    '<h3 class="skill-panel__title"></h3>' +
    '<p class="skill-panel__badge"></p>' +
    '<p class="skill-panel__text"></p>' +
    '<ul class="skill-panel__bullets"></ul>' +
    '</div>';
  document.body.append(backdrop);
  // the panel lives inside the sticky column, in the same rectangle as the ghost card
  // it takes over from — no positioning code, the grid puts it where it belongs
  skillDetail.append(panel);
  const cardBody = panel.querySelector('.skill-panel__body');
  const title = panel.querySelector('.skill-panel__title');
  const badge = panel.querySelector('.skill-panel__badge');
  const text = panel.querySelector('.skill-panel__text');
  const bullets = panel.querySelector('.skill-panel__bullets');

  // "pick a skill" placeholder holding the column until a pill is picked. Markup is in
  // index.html so its copy comes from content.js via [data-copy]; CSS hides it below
  // 1000px, where the panel is a modal and there is no column.
  const ghost = skillDetail.querySelector('.skill-ghost');

  // below this width the grid can't give up a column wide enough for the detail card, so
  // it becomes a centered modal and the page locks behind it. Keep in sync with the
  // max-width: 999px block in sections.css — it is the section's only breakpoint twin.
  const PANEL_MODAL = '(max-width: 999px)';
  const isModal = () => window.matchMedia(PANEL_MODAL).matches;
  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // pointers that can hover: touch fires a stray mouseenter on tap, which would preview a
  // card the user is about to lock anyway and then "un-preview" it on the next tap
  const canHover = window.matchMedia('(hover: hover)');

  // bullets entries are either a plain string or { label, subs: [] } for a nested group
  // (e.g. Substance Painter / Designer under the Substance 3D card)
  const renderBullets = (items) => {
    bullets.innerHTML = '';
    bullets.hidden = !items || !items.length;
    if (!items) return;
    for (const item of items) {
      const li = document.createElement('li');
      if (typeof item === 'string') {
        li.textContent = item;
      } else {
        li.textContent = item.label;
        const sub = document.createElement('ul');
        for (const s of item.subs) {
          const subLi = document.createElement('li');
          subLi.textContent = s;
          sub.append(subLi);
        }
        li.append(sub);
      }
      bullets.append(li);
    }
  };

  const applyContent = (li) => {
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!d) return;
    title.textContent = d.title;
    badge.textContent = d.selfTaught ? '✦ Self-taught' : '';
    badge.hidden = !d.selfTaught;
    text.textContent = d.text;
    renderBullets(d.bullets);
    panel.style.setProperty('--skill-accent', d.color);
  };

  // the column reserves the height of the tallest card in the set, so switching never
  // resizes it (which read as janky and made the shuffle look off) and the pills beside
  // it never reflow. CSS also centers the column on that height. Measured at the real
  // render width, re-run on resize because wrapping — and the modal's narrower width —
  // changes the max.
  const sizePanelToLargest = () => {
    skillDetail.style.setProperty('--skill-card-h', 'auto');
    let max = 0;
    for (const key in SKILL_DESCRIPTIONS) {
      const d = SKILL_DESCRIPTIONS[key];
      title.textContent = d.title;
      badge.textContent = d.selfTaught ? '✦ Self-taught' : '';
      badge.hidden = !d.selfTaught;
      text.textContent = d.text;
      renderBullets(d.bullets);
      max = Math.max(max, panel.scrollHeight);
    }
    skillDetail.style.setProperty('--skill-card-h', `${max}px`);
    // put the card that was on screen back; a closed panel is invisible anyway
    if (shownEl) applyContent(shownEl);
  };

  // "deal onto the stack" swap when jumping pill to pill: the current card is cloned and left
  // frozen in place *under* the real panel, while the new card is dealt in from the side —
  // sliding in with a rotation + scale settle, the way a card is dealt across a table — and
  // lands on top. The old clone doesn't move, it just fades out where it sits. One easing, no
  // per-row stagger, so it reads as a single dealt card. --deal-x/--deal-r/--deal-s feed the
  // is-open transform in sections.css, so it composes with either layout's base position
  // (desktop column / mobile modal) instead of hardcoding a transform.
  // GSAP drives it instead of CSS transitions: its RAF ticker + eased interpolation read as a
  // continuous glide rather than the mechanical feel of a fixed-curve transition. It tweens the
  // --deal-* custom props (not the transform directly) so the base position transform stays intact.
  const DEAL_DUR = 0.7; // seconds — long enough for the glide to read
  const DEAL_SHIFT = 220; // px the new card travels sideways as it's dealt onto the stack
  const BORDER_FADE_DUR = 0.45; // seconds — the accent border crossfades roughly alongside the glide
  const dealSwitch = (applyNow) => {
    // a switch mid-animation: stop the running tweens and drop any clone still on screen
    gsap.killTweensOf(panel);
    skillDetail.querySelectorAll('.is-deal-clone').forEach((c) => c.remove());

    // the outgoing card: a clone frozen on the old content, sitting *under* the real panel
    // so the newly clicked card is dealt on top of it (see z-index on .is-deal-clone).
    // Appended to the column, not the body — the panel is positioned against the column.
    const clone = panel.cloneNode(true);
    clone.classList.add('is-deal-clone');
    clone.style.willChange = 'opacity';
    // the clone inherits .skill-panel's base `transition: opacity 0.3s`, which fights GSAP
    // the same way the transform did: the fade would get re-smoothed over its own 0.3s
    // instead of disappearing quickly like the tween below asks. Strip it.
    clone.style.transition = 'none';
    skillDetail.append(clone);

    // real panel gets the new content and glides in over the clone. will-change promotes both
    // cards to their own GPU layer so the big drop-shadow moves as a texture, not a repaint.
    applyNow();
    panel.style.willChange = 'transform';
    // .skill-panel has its own `transition: transform 0.3s` (sections.css) for the open/close
    // slide. Left on, it fights GSAP here: every rAF tick nudges --deal-x, and the CSS
    // transition keeps re-chasing that moving target over its own 0.3s, smearing the glide
    // down to nearly nothing. Drop transform from the transition for the duration of the deal.
    // border-color is kept — that's what crossfades --skill-accent to the new pill's color —
    // but stretched out, because the base rule's 0.15s made the accent snap instead of blend.
    panel.style.transitionProperty = 'opacity, border-color';
    panel.style.transitionDuration = `${BORDER_FADE_DUR}s`;

    const cleanup = () => {
      clone.remove();
      panel.style.willChange = '';
      panel.style.transitionProperty = '';
      panel.style.transitionDuration = '';
      gsap.set(panel, { clearProps: '--deal-x,--deal-r,--deal-s' });
    };

    // new card: dealt in from the side with a rotation + scale settle, landing on top of the stack
    gsap.fromTo(
      panel,
      { '--deal-x': `${-DEAL_SHIFT}px`, '--deal-r': '-8deg', '--deal-s': 0.92 },
      {
        '--deal-x': '0px', '--deal-r': '0deg', '--deal-s': 1,
        duration: DEAL_DUR, ease: 'power2.out', overwrite: true, onComplete: cleanup,
      }
    );
    // old card underneath: stays put and fades away fast — gone well before the new
    // card (DEAL_DUR 0.7s) finishes its glide, so it reads as already-gone on arrival
    gsap.to(clone, { opacity: 0, duration: 0.2, ease: 'power1.out' });
  };

  // hover previews get a quick crossfade instead of the deal: 0.7s of dealt card on every
  // pill the pointer crosses turns into mush. The content is blanked and swapped in the same
  // frame (is-fading kills the transition on the way out), then fades back in — so the new
  // card is never late, it just arrives softly.
  const fadeSwitch = (applyNow) => {
    gsap.killTweensOf(panel);
    skillDetail.querySelectorAll('.is-deal-clone').forEach((c) => c.remove());
    cardBody.classList.add('is-fading');
    applyNow();
    requestAnimationFrame(() => cardBody.classList.remove('is-fading'));
  };

  let lockedEl = null; // pill that was clicked — the card the column falls back to
  let shownEl = null; // pill whose card is on screen, preview or locked

  // deal = clicked (the full dealt-card glide); otherwise a hover/focus preview.
  // A click re-deals even when the card is already up from a preview — with a mouse that
  // is the *only* way it ever happens, and without it the deal would never play on
  // desktop at all. It doubles as the "pinned" confirmation.
  const showSkill = (li, deal) => {
    if (li === shownEl && !deal) return;
    const wasOpen = !!shownEl;
    shownEl = li;
    if (!wasOpen || isReduced()) applyContent(li);
    else if (deal) dealSwitch(() => applyContent(li));
    else fadeSwitch(() => applyContent(li));
    backdrop.classList.add('is-open');
    panel.classList.add('is-open');
    ghost?.classList.add('is-dismissed');
    if (isModal()) document.body.style.overflow = 'hidden';
  };

  const hideSkill = () => {
    shownEl = null;
    backdrop.classList.remove('is-open');
    panel.classList.remove('is-open');
    ghost?.classList.remove('is-dismissed');
    document.body.style.overflow = '';
  };

  // clicking pins a card so it survives the pointer wandering off; clicking it again clears
  const lockSkill = (li) => {
    if (lockedEl === li) {
      lockedEl.classList.remove('is-active');
      lockedEl = null;
      hideSkill();
      return;
    }
    lockedEl?.classList.remove('is-active');
    lockedEl = li;
    li.classList.add('is-active');
    showSkill(li, true);
  };

  const closeSkill = () => {
    lockedEl?.classList.remove('is-active');
    lockedEl = null;
    hideSkill();
  };

  // back to the pinned card once the pointer or focus leaves the grid, or to the ghost
  const restoreLocked = () => {
    if (lockedEl) showSkill(lockedEl, false);
    else hideSkill();
  };

  skillPills.forEach((li) => {
    // the pills are <li>, so keyboard access has to be granted explicitly
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.addEventListener('click', () => lockSkill(li));
    li.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Space would scroll the page
      lockSkill(li);
    });
    li.addEventListener('mouseenter', () => {
      if (canHover.matches) showSkill(li, false);
    });
    li.addEventListener('focus', () => showSkill(li, false));
  });

  const skillsList = document.querySelector('.skills-list');
  skillsList?.addEventListener('mouseleave', () => {
    if (canHover.matches) restoreLocked();
  });
  skillsList?.addEventListener('focusout', (e) => {
    if (!skillsList.contains(e.relatedTarget)) restoreLocked();
  });

  window.addEventListener('resize', () => {
    sizePanelToLargest();
    // opened on a phone, then the window grew past the modal breakpoint — release the
    // page rather than leaving it stuck until the card is closed
    if (!isModal()) document.body.style.overflow = '';
  });

  sizePanelToLargest();

  panel.querySelector('.skill-panel__close').addEventListener('click', closeSkill);
  // click outside the panel/pills closes it — pill clicks are excluded here so switching
  // straight to another pill re-targets in one click instead of closing first
  window.addEventListener('click', (e) => {
    if (!shownEl) return;
    if (panel.contains(e.target) || e.target.closest('li[data-skill]')) return;
    closeSkill();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shownEl) closeSkill();
  });
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
