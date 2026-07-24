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

// skill pill click → info card (copy lives in src/content.js)
const SKILL_DESCRIPTIONS = content.skills;

const skillPills = document.querySelectorAll('.skills-grid li[data-skill]');
if (skillPills.length) {
  const backdrop = document.createElement('div');
  backdrop.className = 'skill-panel-backdrop';
  const panel = document.createElement('div');
  panel.className = 'skill-panel';
  panel.innerHTML =
    '<button class="skill-panel__close" aria-label="Close">&times;</button>' +
    '<h3 class="skill-panel__title"></h3>' +
    '<p class="skill-panel__badge"></p>' +
    '<p class="skill-panel__text"></p>' +
    '<ul class="skill-panel__bullets"></ul>';
  document.body.append(backdrop, panel);
  const title = panel.querySelector('.skill-panel__title');
  const badge = panel.querySelector('.skill-panel__badge');
  const text = panel.querySelector('.skill-panel__text');
  const bullets = panel.querySelector('.skill-panel__bullets');

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

  // every card is sized to the tallest one in the set, so switching never resizes the box
  // (which read as janky and made the shuffle look off). Measured at the real render width,
  // re-run on resize because wrapping — and the modal's narrower width — changes the max.
  const sizePanelToLargest = () => {
    panel.style.minHeight = '';
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
    panel.style.minHeight = `${max}px`;
    // leave the currently open card's content in place; a closed panel is invisible anyway
    if (activeSkillEl) {
      const d = SKILL_DESCRIPTIONS[activeSkillEl.dataset.skill];
      if (d) {
        title.textContent = d.title;
        badge.textContent = d.selfTaught ? '✦ Self-taught' : '';
        badge.hidden = !d.selfTaught;
        text.textContent = d.text;
        renderBullets(d.bullets);
      }
    }
  };

  // "deal onto the stack" swap when jumping pill to pill: the current card is cloned and left
  // frozen in place *under* the real panel, while the new card is dealt in from the side —
  // sliding in with a rotation + scale settle, the way a card is dealt across a table — and
  // lands on top. The old clone doesn't move, it just fades out where it sits. One easing, no
  // per-row stagger, so it reads as a single dealt card. --deal-x/--deal-r/--deal-s feed the
  // is-open transform in sections.css, so it composes with either layout's base position
  // (desktop float / mobile modal) instead of hardcoding a transform.
  // GSAP drives it instead of CSS transitions: its RAF ticker + eased interpolation read as a
  // continuous glide rather than the mechanical feel of a fixed-curve transition. It tweens the
  // --deal-* custom props (not the transform directly) so the base centering transform stays intact.
  const DEAL_DUR = 0.7; // seconds — long enough for the glide to read
  const DEAL_SHIFT = 220; // px the new card travels sideways as it's dealt onto the stack
  const BORDER_FADE_DUR = 0.45; // seconds — the accent border crossfades roughly alongside the glide
  const dealSwitch = (applyContent) => {
    // a switch mid-animation: stop the running tweens and drop any clone still on screen
    gsap.killTweensOf(panel);
    document.querySelectorAll('.is-deal-clone').forEach((c) => c.remove());

    // the outgoing card: a clone frozen on the old content, sitting *under* the real panel
    // so the newly clicked card is dealt on top of it (see z-index on .is-deal-clone)
    const clone = panel.cloneNode(true);
    clone.classList.add('is-deal-clone');
    clone.style.willChange = 'opacity';
    // the clone inherits .skill-panel's base `transition: opacity 0.3s` plus the 0.16s
    // transition-delay from .is-open — both fight GSAP the same way the transform did:
    // the fade would start 0.16s late and then get re-smoothed over its own 0.3s, instead
    // of disappearing quickly like the tween below asks. Strip it so GSAP has sole control.
    clone.style.transition = 'none';
    document.body.appendChild(clone);

    // real panel gets the new content and glides in over the clone. will-change promotes both
    // cards to their own GPU layer so the big drop-shadow moves as a texture, not a repaint.
    applyContent();
    panel.style.willChange = 'transform';
    // .skill-panel has its own `transition: transform 0.3s` (sections.css) for the open/close
    // slide. Left on, it fights GSAP here: every rAF tick nudges --deal-x, and the CSS
    // transition keeps re-chasing that moving target over its own 0.3s, smearing the glide
    // down to nearly nothing. Drop transform from the transition for the duration of the deal.
    // border-color is kept (that's what crossfades --skill-accent to the new pill's color) but
    // re-timed: the base rule's 0.15s plus the 0.16s transition-delay .is-open carries (meant
    // for the initial open, but it matches on *any* property change while is-open is set) made
    // the accent snap late and fast instead of blending. Zero the delay and stretch it out here.
    panel.style.transitionProperty = 'opacity, border-color';
    panel.style.transitionDelay = '0s';
    panel.style.transitionDuration = `${BORDER_FADE_DUR}s`;

    const cleanup = () => {
      clone.remove();
      panel.style.willChange = '';
      panel.style.transitionProperty = '';
      panel.style.transitionDelay = '';
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

  let activeSkillEl = null;
  // set while ensurePanelClearance's own corrective scroll is in flight, so the scroll-close
  // listener further down doesn't see the still-short geometry on the scroll's first frames
  // and close the panel that scroll exists to make room for
  let suppressScrollClose = false;
  let suppressScrollCloseTimer;

  // "pick a skill" placeholder holding the gutter until a pill is clicked. It lives in
  // index.html so its copy comes from content.js via [data-copy]; CSS keeps it out of
  // the way below 1000px, where the panel is a modal and there is no gutter.
  const ghost = document.querySelector('.skill-ghost');

  // viewports where the panel is a centered modal instead of floating beside the grid —
  // must match the media query on .skill-panel in sections.css
  const PANEL_MODAL = '(max-width: 999px)';

  // phones only: the panel covers most of the screen there, so the page stays locked
  // behind it. Everywhere else — tablets included — the page keeps scrolling and the
  // panel simply leaves with the section, the same way the ghost card does.
  const SCROLL_LOCK = '(max-width: 700px)';

  // keep the panel clear of the grid: center it in the leftover space between the
  // grid's actual right edge and the viewport edge, so it never lands on top of a pill.
  // The ghost card occupies the same slot, so it gets the same left.
  const positionSkillPanel = () => {
    if (window.matchMedia(PANEL_MODAL).matches) {
      panel.style.left = '';
      panel.style.right = '';
      return;
    }
    const grid = document.querySelector('.skills-grid');
    if (!grid) return;
    const gridRect = grid.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || 360;
    const available = window.innerWidth - gridRect.right;
    const maxLeft = window.innerWidth - panelWidth - 16;
    const left = Math.min(gridRect.right + (available - panelWidth) / 2, maxLeft);
    panel.style.left = `${Math.max(left, 16)}px`;
    panel.style.right = 'auto';
    if (!ghost) return;
    ghost.style.left = panel.style.left;
    ghost.style.right = 'auto';
    // the panel may clamp on top of the grid rather than disappear — that's a deliberate
    // user action. The ghost is only an invitation, so wherever the gutter is too narrow
    // for it, it steps aside instead of parking on the pills.
    ghost.classList.toggle('is-cramped', available < panelWidth + 24);
  };

  // the ghost is position:fixed like the panel, so it has to be switched off outside the
  // skills section or it hangs over About and Projects. An IntersectionObserver can't
  // express the rule we actually want — it fires as soon as the section *touches* the
  // observed band, so the card popped in while the About photo was still on screen —
  // so compare the rectangles directly: the card only shows once it, plus a margin,
  // fits inside the section. That starts the fade well before either neighbour arrives.
  const skillsSection = document.getElementById('skills');
  const GHOST_CLEARANCE = 96; // px of section that must sit above and below the card

  // is the fixed card's slot (the middle of the viewport) still well inside the section?
  const cardSlotInSection = (cardHeight) => {
    if (!skillsSection) return false;
    const rect = skillsSection.getBoundingClientRect();
    const mid = window.innerHeight / 2; // both cards are centered on the viewport
    const reach = cardHeight / 2 + GHOST_CLEARANCE;
    return rect.top < mid - reach && rect.bottom > mid + reach;
  };

  const updateGhostVisibility = () => {
    if (!ghost) return;
    ghost.classList.toggle('is-visible', cardSlotInSection(ghost.offsetHeight));
  };

  // clicking a pill near the bottom of the section can leave the fixed, viewport-centered
  // panel taller than the section has room for below it, so it spills onto Projects (or
  // above it, onto About, right near the top of the section). Reuses the same
  // cardSlotInSection geometry the ghost/close logic already relies on, just to decide how
  // far to nudge the scroll instead of whether to show/hide something.
  const ensurePanelClearance = () => {
    if (window.matchMedia(PANEL_MODAL).matches) return; // modal panel is centered on the viewport regardless of scroll
    if (!skillsSection || cardSlotInSection(panel.offsetHeight)) return;
    const rect = skillsSection.getBoundingClientRect();
    const mid = window.innerHeight / 2;
    const reach = panel.offsetHeight / 2 + GHOST_CLEARANCE;
    const shortfallBelow = (mid + reach) - rect.bottom; // > 0: not enough section left below the panel's slot
    const shortfallAbove = (mid - reach) - rect.top; // > 0: not enough section above it (opened right as the section arrived)
    const delta = shortfallBelow > 0 ? -shortfallBelow : shortfallAbove > 0 ? shortfallAbove : 0;
    if (!delta) return;
    suppressScrollClose = true;
    window.scrollBy({ top: delta, behavior: 'smooth' });
    clearTimeout(suppressScrollCloseTimer);
    suppressScrollCloseTimer = setTimeout(() => { suppressScrollClose = false; }, 500);
  };

  const closeSkillPanel = () => {
    activeSkillEl?.classList.remove('is-active');
    activeSkillEl = null;
    backdrop.classList.remove('is-open');
    panel.classList.remove('is-open');
    ghost?.classList.remove('is-dismissed');
    document.body.style.overflow = '';
  };

  const openSkillPanel = (li) => {
    const wasOpen = !!activeSkillEl;
    activeSkillEl?.classList.remove('is-active');
    activeSkillEl = li;
    li.classList.add('is-active');
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!d) return;
    const applyContent = () => {
      title.textContent = d.title;
      badge.textContent = d.selfTaught ? '✦ Self-taught' : '';
      badge.hidden = !d.selfTaught;
      text.textContent = d.text;
      renderBullets(d.bullets);
      panel.style.setProperty('--skill-accent', d.color);
    };
    if (wasOpen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // switching pill to pill — shuffle the rows out and deal the new ones in
      dealSwitch(applyContent);
    } else {
      applyContent();
    }
    positionSkillPanel();
    backdrop.classList.add('is-open');
    panel.classList.add('is-open');
    ghost?.classList.add('is-dismissed');
    if (window.matchMedia(SCROLL_LOCK).matches) document.body.style.overflow = 'hidden';
    if (!wasOpen) ensurePanelClearance(); // only on a fresh open — mid-switch the section hasn't moved
  };

  skillPills.forEach((li) => {
    li.addEventListener('click', () => {
      if (activeSkillEl === li) closeSkillPanel();
      else openSkillPanel(li);
    });
  });

  // the page keeps scrolling with a panel open (except on phones), so an open panel has
  // to leave the same way the ghost card does: once its slot is no longer inside the
  // skills section. Otherwise it would hang over About or Projects.
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        updateGhostVisibility();
        if (activeSkillEl && !suppressScrollClose && !window.matchMedia(SCROLL_LOCK).matches
          && !cardSlotInSection(panel.offsetHeight)) closeSkillPanel();
      });
    },
    { passive: true }
  );

  // unconditional: the ghost sits in the same slot and has to follow the grid even
  // while the panel is closed
  window.addEventListener('resize', () => {
    sizePanelToLargest();
    positionSkillPanel();
    updateGhostVisibility();
    // opened on a phone, then the window grew past the lock breakpoint — release the
    // page rather than leaving it stuck until the panel is closed
    if (!window.matchMedia(SCROLL_LOCK).matches) document.body.style.overflow = '';
  });

  sizePanelToLargest();
  positionSkillPanel();
  updateGhostVisibility();

  panel.querySelector('.skill-panel__close').addEventListener('click', closeSkillPanel);
  // click outside the panel/pills closes it — pill clicks are excluded here so switching
  // straight to another pill re-targets in one click instead of closing first
  window.addEventListener('click', (e) => {
    if (!activeSkillEl) return;
    if (panel.contains(e.target) || e.target.closest('li[data-skill]')) return;
    closeSkillPanel();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeSkillEl) closeSkillPanel();
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
