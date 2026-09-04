import gsap from 'gsap';
import { content } from './content.js';

// Service tree for the homelab page — everything runs on one Proxmox host, so
// the drawing is a hierarchy, not a star: hub → category → service. Connectors
// are orthogonal elbows, the same routing language as the hardware wiring
// diagram above it on the page, so the two read as one system.
//
// The tree lines are drawn in CSS (borders on the list items, see sections.css)
// rather than SVG — the rows are text, so letting the browser lay them out is
// what makes the whole thing reflow onto a phone with no second markup path.
//
// Picking a service dims the rest of the tree and opens its card: the same
// "focus one thing, let the rest recede" grammar as the 3D hero cloud and the
// skills wall. The card is a single element moved to sit right after the active
// row, which is the whole trick — on a phone that position IS the layout (it
// unfolds in place), and on desktop CSS lifts it out of flow into the empty
// column beside the tree without any measuring code. No breakpoint twin.

// A service name maps to public/icons/services/<slug>.svg by slug. Marks whose
// upstream file has a different name, or aren't SVG at all, are listed here.
// Hermes Agent has no plain logomark — Nous Research's only square asset is
// their mascot artwork (hermes-agent.nousresearch.com/docs/img/logo.png),
// framed in a solid black border for its own docs sidebar. That border reads
// as a stray square outline once dropped into this UI, so the source here has
// it cropped off before the usual white-on-transparent recolor (same
// treatment as the skills wall's Ableton/Unreal marks).
const ICON_OVERRIDES = {
  'Hermes Agent': '/icons/services/hermes-agent.png',
};

function iconSrc(name) {
  if (ICON_OVERRIDES[name]) return ICON_OVERRIDES[name];
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return `/icons/services/${slug}.svg`;
}

function buildIcon(name, size) {
  const img = document.createElement('img');
  img.className = 'hd-icon';
  img.src = iconSrc(name);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = size;
  img.height = size;
  return img;
}

export function initHomelabDiagram(container) {
  const { hub, categories } = content.homelab.diagram;
  const { serviceInfo } = content.homelab;

  const tree = document.createElement('div');
  tree.className = 'hd-tree';

  // one card, reused: it is moved next to whichever row is active. Not
  // hidden — it starts detached from the DOM (never appended until the
  // first openCard call), and GSAP owns its height/opacity from then on.
  const card = document.createElement('div');
  card.className = 'hd-card';
  card.id = 'hd-card';

  const inner = document.createElement('div');
  inner.className = 'hd-card__inner';

  const cardHead = document.createElement('div');
  cardHead.className = 'hd-card__head';
  const cardIcon = buildIcon(hub, 36);
  const cardTitle = document.createElement('h3');
  cardTitle.className = 'hd-card__title';
  cardHead.append(cardIcon, cardTitle);

  const cardText = document.createElement('p');
  cardText.className = 'hd-card__text';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'hd-card__close';
  close.setAttribute('aria-label', 'Close');
  // drawn, not a × glyph — same rule as the skills card
  close.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

  // close lives inside inner, not beside it: inner is what GSAP applies a
  // transform to while it rises into place, which promotes it to its own
  // stacking context — a sibling close button would end up buried under
  // that context instead of sitting visibly on top of it.
  inner.append(close, cardHead, cardText);
  card.append(inner);

  let active = null;
  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Same two-layer unfold as the skills wall's card (main.js): the shell's
  // height/opacity is the container GSAP measures and clips, the inner
  // content rises into it a beat later so the box doesn't just pop full-size.
  function closeCard() {
    if (active) active.setAttribute('aria-expanded', 'false');
    active = null;
    tree.classList.remove('is-focused');
    gsap.killTweensOf(card);
    if (isReduced()) {
      card.remove();
      return;
    }
    gsap.to(card, {
      height: 0,
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => card.remove(),
    });
  }

  function openCard(button, name) {
    if (active === button) return closeCard();
    if (active) active.setAttribute('aria-expanded', 'false');
    active = button;
    button.setAttribute('aria-expanded', 'true');

    cardIcon.src = iconSrc(name);
    cardTitle.textContent = name;
    cardText.textContent = serviceInfo[name];

    // the row's own <li> is the anchor; on desktop CSS takes the card out of
    // flow from here, on a phone it simply unfolds at this spot
    gsap.killTweensOf(card);
    gsap.killTweensOf(inner);
    button.closest('li, .hd-hub').after(card);
    tree.classList.add('is-focused');

    if (isReduced()) {
      gsap.set(card, { height: 'auto', opacity: 1 });
      gsap.set(inner, { y: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(
      card,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out' },
    );
    gsap.fromTo(
      inner,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.08, ease: 'power3.out' },
    );
  }

  function buildRow(name, className, iconSize) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.append(buildIcon(name, iconSize));
    const label = document.createElement('span');
    label.className = 'hd-row-label';
    label.textContent = name;
    button.append(label);

    if (serviceInfo[name]) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', card.id);
      button.addEventListener('click', () => openCard(button, name));
    } else {
      button.disabled = true;
    }
    return button;
  }

  const hubEl = document.createElement('div');
  hubEl.className = 'hd-hub';
  const hubButton = buildRow(hub, 'hd-hub__button', 36);
  hubEl.append(hubButton);

  const branches = document.createElement('ul');
  branches.className = 'hd-branches';

  categories.forEach((cat) => {
    const branch = document.createElement('li');
    branch.className = 'hd-branch';

    const label = document.createElement('p');
    label.className = 'hd-branch__label';
    label.textContent = cat.label;
    branch.append(label);

    const leaves = document.createElement('ul');
    leaves.className = 'hd-leaves';
    cat.services.forEach((service) => {
      const li = document.createElement('li');
      li.className = 'hd-leaf';
      li.append(buildRow(service, 'hd-leaf__button', 26));
      leaves.append(li);
    });

    branch.append(leaves);
    branches.append(branch);
  });

  tree.append(hubEl, branches);
  container.append(tree);

  // Opens with the hub's own card already showing. Two reasons: it fills the
  // gutter the card layout otherwise leaves empty next to a short tree (see
  // sections.css's side-column media query), and it demonstrates the
  // click-a-row interaction before a visitor has to discover it themselves.
  openCard(hubButton, hub);

  close.addEventListener('click', () => {
    const previous = active;
    closeCard();
    previous?.focus();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && active) {
      const previous = active;
      closeCard();
      previous.focus();
    }
  });

  // Roving tabindex (WAI-ARIA APG "toolbar" pattern): every enabled row used
  // to sit in the page's tab order (17 of the page's 25 stops), forcing
  // keyboard users through the whole list to reach the footer. Only one row
  // is a tab stop at a time; arrow keys move within the tree.
  const rows = Array.from(tree.querySelectorAll('.hd-hub__button, .hd-leaf__button')).filter(
    (row) => !row.disabled,
  );
  rows.forEach((row, i) => {
    row.tabIndex = i === 0 ? 0 : -1;
  });

  tree.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const current = rows.indexOf(document.activeElement);
    if (current === -1) return;
    e.preventDefault();
    const next =
      e.key === 'ArrowDown'
        ? (current + 1) % rows.length
        : e.key === 'ArrowUp'
          ? (current - 1 + rows.length) % rows.length
          : e.key === 'Home'
            ? 0
            : rows.length - 1;
    rows[current].tabIndex = -1;
    rows[next].tabIndex = 0;
    rows[next].focus();
  });
}
