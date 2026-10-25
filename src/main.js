import gsap from 'gsap';
import './styles/base.css';
import './styles/sections.css';
import { initAnimations, refreshScrollTriggers } from './animations.js';
import { initAnalytics } from './analytics.js';
import { initMobileMenu } from './mobileMenu.js';
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

// Everything that belongs to one page. Run once on load, and again after every in-place swap
// (src/router.js), which first aborts the previous run's `signal`: every window listener,
// loop, observer and WebGL context below is tied to it, so the outgoing page leaves nothing
// running behind the new one.
function initPage(signal, firstLoad) {
  // fill every [data-copy="a.b.c"] element from content.js — runs before any animation
  // so GSAP only ever sees the final text, never a swap mid-reveal
  document.querySelectorAll('[data-copy]').forEach((el) => {
    const value = el.dataset.copy.split('.').reduce((o, k) => o?.[k], content);
    if (typeof value !== 'string') return;
    el.innerHTML = value.split('\n').map(escapeHtml).join('<br>');
  });
  // .btn: the copy's leading or trailing arrow moves onto the pill's knob (base.css)
  document.querySelectorAll('.btn').forEach((btn) => {
    if (btn.querySelector('.btn__knob')) return;
    const m = btn.textContent.trim().match(/^([←→↑↓↗])\s*(.+)$|^(.+?)\s*([←→↑↓↗])$/u);
    if (!m) return;
    const knob = document.createElement('span');
    knob.className = 'btn__knob';
    knob.setAttribute('aria-hidden', 'true');
    knob.textContent = m[1] || m[4];
    btn.textContent = m[2] || m[3];
    if (m[1]) btn.prepend(knob);
    else {
      knob.classList.add('btn__knob--end');
      btn.append(knob);
    }
  });
  // footer: when the site last changed, from the last commit at build time (vite.config.js).
  // The footer sits outside the swapped page (src/router.js), so it is filled only once.
  const updated = import.meta.env.VITE_SITE_UPDATED;
  const copyright = document.querySelector('.footer [data-copy="footer.copyright"]');
  if (updated && copyright && !copyright.querySelector('.footer__updated')) {
    const when = new Date(`${updated}T12:00:00`).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
    const span = document.createElement('span');
    span.className = 'footer__updated';
    span.textContent = ` · Updated ${when}`;
    copyright.append(span);
  }
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const status = contactForm.querySelector('.contact-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const say = (text, kind = '') => {
      status.textContent = text;
      status.className = `contact-status${kind ? ` is-${kind}` : ''}`;
    };

    // each field says what is missing right under it, in words, instead of the browser's bubble.
    // Checked on leaving a field the visitor has typed in, and again as they fix it.
    const fields = [...contactForm.querySelectorAll('input, textarea')];
    const MISSING = {
      name: 'Your name, so I know who is writing.',
      email: 'Your email, so I can reply.',
      message: 'A few words about the project.',
    };
    const checks = fields.map((field) => {
      const error = document.createElement('p');
      error.className = 'contact-error';
      error.id = `${field.id}-error`;
      field.setAttribute('aria-describedby', error.id);
      field.after(error);
      const check = () => {
        const v = field.validity;
        const text = v.valueMissing
          ? MISSING[field.name]
          : v.typeMismatch
            ? 'That email looks incomplete: check the @ and the part after it.'
            : '';
        error.textContent = text;
        if (text) field.setAttribute('aria-invalid', 'true');
        else field.removeAttribute('aria-invalid');
        return !text;
      };
      field.addEventListener('blur', () => field.value && check());
      field.addEventListener('input', () => field.hasAttribute('aria-invalid') && check());
      return { field, check };
    });

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const bad = checks.filter(({ check }) => !check());
      if (bad.length) {
        say(
          bad.length === 1 ? 'One field needs a look.' : `${bad.length} fields need a look.`,
          'error',
        );
        bad[0].field.focus();
        return;
      }
      if (!navigator.onLine) {
        say(
          "You seem to be offline. Your message is still here: send it once you're back.",
          'error',
        );
        return;
      }
      submitBtn.disabled = true;
      say('Sending...');
      try {
        const res = await fetch(content.contact.formEndpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(contactForm),
        });
        if (res.ok) {
          say("Sent. Thanks, I'll get back to you soon.", 'ok');
          contactForm.reset();
        } else {
          say(
            "It didn't go through, and your message is still here. Try again, or reach me on LinkedIn below.",
            'error',
          );
        }
      } catch {
        say(
          "It didn't go through, and your message is still here. Try again, or reach me on LinkedIn below.",
          'error',
        );
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
  if (firstLoad && location.hash) {
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
  signal.addEventListener('abort', () => observer.disconnect());

  initAnimations();

  // vivatech "The visitor's path": an animated hand under each step
  const vtSteps = document.querySelector('.vt-steps');
  if (vtSteps)
    import('./gestureHands.js').then((m) => signal.aborted || m.initGestureHands(vtSteps));

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
    const galleryObserver = new IntersectionObserver(revealImage, {
      rootMargin: '0px 0px -10% 0px',
    });
    // CSS multi-column balances its columns' heights across two layout passes — an
    // estimate, then a correction once every image's aspect-ratio has actually resolved.
    // Observing on the estimate meant a couple of images could sit inside the viewport
    // for that one transitional frame and permanently unobserve themselves as "revealed"
    // long before they scroll anywhere near it. A frame of slack lets it settle first.
    requestAnimationFrame(() => {
      gallery.querySelectorAll('img').forEach((img) => galleryObserver.observe(img));
    });
  }

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
  // not change mode, a reload does). Phone gets the wall as an accordion: one row per category,
  // the card unfolding right under the tapped tool. Reduced-motion desktop and a failed drawer
  // import still fall back to the plain full-width wall untouched.
  const IS_PHONE_SKILLS_LAYOUT = window.matchMedia('(max-width: 700px)').matches;

  function initSkillsWall() {
    if (!skillsSection || !skillTiles.length) return;
    // the invitation, in the same place the hero puts its own "click on an object" line
    const hint = document.createElement('p');
    hint.className = 'skills-hint';
    hint.textContent =
      (matchMedia('(pointer: coarse)').matches && content.skillsHint?.textTouch) ||
      content.skillsHint?.text ||
      'Click any tool to see what I actually do with it.';
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

    // phone: the card opens under the tool, often past the bottom edge - bring it into view
    const revealCard = (smooth) => {
      if (IS_PHONE_SKILLS_LAYOUT)
        card.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
    };

    const openCard = (li) => {
      const grid = li.closest('.skills-grid');
      if (!applyContent(li) || !grid) return;
      // In drawer mode the folders sit in one horizontal row, so there is no row for the card
      // to unfold inside: it opens in a slot below the drawer instead. With no slot (the
      // mobile / no-WebGL wall) it still unfolds under the category that owns the pick.
      // On phone the card unfolds right under the tapped tool, inside its open category.
      const mount = IS_PHONE_SKILLS_LAYOUT
        ? null
        : document.querySelector('#skill-card-slot') || grid;
      const movingRow = mount ? card.parentElement !== mount : card.previousElementSibling !== li;

      activeEl?.classList.remove('is-active');
      activeEl = li;
      li.classList.add('is-active');
      skillsSection.classList.add('is-focused');
      document
        .querySelectorAll('.has-open-card')
        .forEach((g) => g.classList.remove('has-open-card'));
      li.closest('.skill-group')?.classList.add('has-open-card');

      // the card is a grid item spanning the row, appended to the category that owns the
      // pick — so it always unfolds under the tool, never somewhere else on the wall
      gsap.killTweensOf(card);
      gsap.killTweensOf(inner);
      if (mount) mount.append(card);
      else li.after(card);
      if (isReduced()) {
        gsap.set(card, { height: 'auto', opacity: 1 });
        gsap.set(inner, { y: 0, opacity: 1 });
        revealCard(false);
        return;
      }
      // switching within a row is a content swap, not a second unfold: only the height
      // re-measures. Landing in a new row unfolds from nothing.
      gsap.fromTo(
        card,
        { height: movingRow ? 0 : card.offsetHeight, opacity: movingRow ? 0 : 1 },
        // 0.35, not the 0.55 this shipped with: this is the answer to a tap, and it animates
        // height, which relayouts - the shorter it runs, the less of that there is to drop
        {
          height: 'auto',
          opacity: 1,
          duration: 0.35,
          ease: 'power3.out',
          onComplete: () => revealCard(true),
        },
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

    // A list may only hold list items, and these tiles are buttons: each category becomes a
    // labelled group of buttons instead (axe's "list" rule, Lighthouse a11y on phone).
    document.querySelectorAll('.skills-grid').forEach((grid) => {
      grid.setAttribute('role', 'group');
      const name = grid.closest('.skill-group')?.querySelector('h3')?.textContent.trim();
      if (name) grid.setAttribute('aria-label', name);
    });

    // Phone: an accordion, one row per category. The heading's text moves into a real button
    // that shows or hides its tools; the first category starts open so the section never
    // reads as empty. Closing a category that holds the open card closes the card with it.
    if (IS_PHONE_SKILLS_LAYOUT) {
      document.querySelectorAll('.skill-group').forEach((group, i) => {
        const h3 = group.querySelector('h3');
        const grid = group.querySelector('.skills-grid');
        if (!h3 || !grid) return;
        grid.id ||= `skill-group-${i}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'skill-group__toggle';
        btn.setAttribute('aria-controls', grid.id);
        const name = document.createElement('span');
        name.textContent = h3.textContent.trim();
        const count = document.createElement('span');
        count.className = 'skill-group__count';
        count.textContent = grid.querySelectorAll('li[data-skill]').length;
        btn.append(name, count);
        h3.replaceChildren(btn);
        const setOpen = (open) => {
          btn.setAttribute('aria-expanded', open);
          grid.hidden = !open;
        };
        setOpen(i === 0);
        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') !== 'true';
          if (!open && grid.contains(card)) closeCard(true);
          setOpen(open);
        });
      });
    }

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
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && activeEl) {
          const target = activeEl;
          closeCard();
          target.focus();
        }
      },
      { signal },
    );

    // clicking away from the wall closes it; the card and the tiles handle their own clicks
    window.addEventListener(
      'click',
      (e) => {
        if (!activeEl || card.contains(e.target) || e.target.closest('.skills-grid li')) return;
        closeCard();
      },
      { signal },
    );
  }

  // the DJ set player — lazy, and mounted on #skill-drawer in *both* modes. That element is
  // in the markup either way: with the metal live it is the positioned box the player parks
  // in the corner of, and without it a plain wrapper the player falls into the flow of. So
  // there is one mount point, one DOM, and no branch here beyond when to call this.
  const skillDrawerEl = document.querySelector('#skill-drawer');
  const mountSets = () => {
    if (!skillDrawerEl) return; // every page but the home page
    import('./setPlayer.js').then((m) => signal.aborted || m.initSetPlayer(skillDrawerEl));
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
      if (signal.aborted) return;
      m.initHero3D(heroCanvas, signal);
      // the "click the objects" hint only makes sense once the 3D scene exists
      const hint = document.querySelector('.hero-hint');
      if (!hint) return;
      if (matchMedia('(pointer: coarse)').matches && content.hero?.hintTouch)
        hint.textContent = content.hero.hintTouch;
      hint.hidden = false;
    });
  }

  // The drawer hides the skill list behind tabs rendered at a few pixels in perspective. This is
  // the same list as plain text under it, built from the strip's own groups so there is one
  // source of truth. The groups are read BEFORE initSkillDrawer(), which lifts every folder out
  // of the strip into the 3D scene. aria-hidden: the real folders already carry the content for
  // assistive tech.
  function readSkillGroups(strip) {
    return [...strip.querySelectorAll('.skill-group')].map((group) => ({
      name: group.querySelector('h3').textContent.trim(),
      tools: [...group.querySelectorAll('.skill-label')].map((l) => l.textContent.trim()),
    }));
  }

  function mountSkillsGlance(drawer, groups) {
    const list = document.createElement('ul');
    list.className = 'skills-glance';
    list.setAttribute('aria-hidden', 'true');
    groups.forEach(({ name, tools }) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'skills-glance__name';
      label.textContent = name;
      const text = document.createElement('span');
      text.className = 'skills-glance__tools';
      text.textContent = tools.join(' \u00b7 ');
      item.append(label, text);
      list.append(item);
    });
    drawer.after(list);
  }

  // the skill drawer's metal shell — lazy, same gate as the hero: under reduced motion the
  // three.js chunk is never fetched and the section falls back to the flat wall
  // below 701px a perspective drawer is unreadable, so the chunk is not even fetched there
  if (DRAWER_MODE) {
    const skillDrawer = skillDrawerEl;
    const scene = skillDrawer.querySelector('.drawer__scene');
    const strip = skillDrawer.querySelector('.drawer__strip');
    const skillGroups = readSkillGroups(strip);
    import('./skillDrawer.js')
      .then((m) => {
        if (signal.aborted) return;
        const dispose = m.initSkillDrawer(scene, strip);
        signal.addEventListener('abort', dispose);
        // only claim the drawer once the metal is actually there; CSS keys the whole layout
        // off this class
        skillDrawer.classList.add('is-live');
        mountSkillsGlance(skillDrawer, skillGroups);
        // .is-live swaps the flat .drawer__strip grid (tall) for the drawer's own much
        // shorter aspect-ratio box — every ScrollTrigger below this point (Projects' h2 clip
        // reveal, its [data-reveal] cards, Contact) was measured against the taller layout a
        // moment ago in initAnimations() and is now stale, firing at pixel offsets well past
        // where those sections actually sit. See refreshScrollTriggers() in animations.js.
        refreshScrollTriggers();
        // the drawer's margin moves the whole page below it when it opens or shuts (see
        // --shut-gap in sections.css), so the triggers down there are re-measured once it lands
        skillDrawer.addEventListener('transitionend', (e) => {
          if (e.target === skillDrawer && e.propertyName === 'margin-bottom')
            refreshScrollTriggers();
        });
        // after is-live: the player's own CSS is scoped to it, and mounting first would flash
        // the flow-layout variant for a frame
        mountSets();
      })
      // the metal failed, so hand the section back to the wall it would have replaced
      .catch(() => {
        if (signal.aborted) return;
        document.documentElement.classList.remove('drawer-pending'); // see index.html's <head>
        initSkillsWall();
        if (!IS_PHONE_SKILLS_LAYOUT) mountSets();
      });
  }

  // company brain: company systems flowing into one answer, next to the intro (company-brain.html only)
  const sourcesGraph = document.getElementById('sources-graph');
  if (sourcesGraph) {
    import('./sourcesGraph.js').then(
      (m) => signal.aborted || m.initSourcesGraph(sourcesGraph, signal),
    );
  }

  // company brain: the example chat plays each scene out (company-brain.html only)
  const cbChat = document.querySelector('.cb-chat');
  if (cbChat) {
    import('./companyBrainDemo.js').then((m) => signal.aborted || m.initCompanyBrainDemo(cbChat));
  }

  // projects row: light the edge fades and arrows only on the side that has more to scroll to
  const projectsScroller = document.getElementById('projects-scroller');
  if (projectsScroller) {
    const grid = projectsScroller.querySelector('.projects-grid');
    const [prev, next] = projectsScroller.querySelectorAll('.projects-arrow');
    const count = projectsScroller.querySelector('.projects-count');
    const cards = grid.querySelectorAll('.card');
    const update = () => {
      const max = grid.scrollWidth - grid.clientWidth;
      projectsScroller.classList.toggle('can-prev', grid.scrollLeft > 4);
      projectsScroller.classList.toggle('can-next', grid.scrollLeft < max - 4);
      // the card the snap has parked at the left edge; at the end of the row, the last one
      // on wide screens several cards show at once, so the count names the range: "1-3 / 4"
      const step = cards[1].offsetLeft - cards[0].offsetLeft;
      const shown = Math.max(1, Math.floor((grid.clientWidth + 8) / step));
      const last =
        grid.scrollLeft >= max - 4 ? cards.length : Math.round(grid.scrollLeft / step) + shown;
      const first = Math.max(1, Math.min(last, cards.length) - shown + 1);
      const end = Math.min(last, cards.length);
      count.textContent = `${first === end ? end : `${first}-${end}`} / ${cards.length}`;
    };
    const step = (dir) => {
      const card = grid.querySelector('.card');
      const by = card.getBoundingClientRect().width + parseFloat(getComputedStyle(grid).columnGap);
      grid.scrollBy({
        left: dir * by,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    };
    prev.hidden = next.hidden = false;
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    grid.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(grid);
    update();
  }

  // homelab network diagram (homelab.html only) — real content, always renders;
  // only the connection-line pulse is gated by reduced-motion, in CSS
  const homelabDiagram = document.querySelector('#homelab-diagram');
  if (homelabDiagram) {
    import('./homelabDiagram.js').then(
      (m) => signal.aborted || m.initHomelabDiagram(homelabDiagram, signal),
    );
  }

  // pipeline projects page - copy lands after the reveals are measured, so the
  // page grows under ScrollTrigger: refresh once it is in
  if (document.querySelector('#pp-index')) {
    import('./pipelineProjects.js').then((m) => {
      if (signal.aborted) return;
      m.initPipelineProjects();
      refreshScrollTriggers();
    });
  }

  // homelab hardware diagram (homelab.html only) — same reasoning as above
  const homelabHardware = document.querySelector('#homelab-hardware');
  if (homelabHardware) {
    import('./homelabHardware.js').then(
      (m) => signal.aborted || m.initHomelabHardware(homelabHardware),
    );
  }
}

let page = new AbortController();
initPage(page.signal, true);
initAnalytics();
initMobileMenu();
// The router exists for one reason: keeping a playing set alive across pages. So it is
// loaded the first time a set starts (setPlayer.js fires this), never on page load.
window.addEventListener(
  'setplayer:start',
  () =>
    import('./router.js').then((m) =>
      m.initRouter(
        () => {
          page.abort();
          page = new AbortController();
          return page;
        },
        (controller) => initPage(controller.signal, false),
      ),
    ),
  { once: true },
);
