import { content } from './content.js';

// Pipeline Projects page: the copy lives in content.js (one source, like the
// rest of the site), the redrawn tool UIs are plain markup in the page. This
// module pours the copy into place and wires the mockups' pointer theatre
// (see initMockup). The Omniverse sections open and close on their own: they
// are native <details>, no JS needed.

// same **bold** rule as main.js's data-copy fill: developer-authored copy only
function rich(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function icon(src, size) {
  const img = el('img');
  img.src = `/icons/${src}`;
  img.alt = '';
  img.width = size;
  img.height = size;
  return img;
}

function buildIndex(list, tools) {
  tools.forEach((tool) => {
    const a = el('a', 'pp-index__tile');
    a.href = `#${tool.id}`;
    a.append(
      icon(tool.icon, 28),
      el('span', 'pp-index__name', rich(tool.name)),
      el('span', 'pp-index__label', 'Problem'),
      el('span', 'pp-index__problem', rich(tool.teaser)),
      ...(tool.outcome
        ? [
            el('span', 'pp-index__label', 'What changed'),
            el('span', 'pp-index__problem pp-index__outcome', rich(tool.outcome)),
          ]
        : []),
      // arrow down: the chapter is further down this page, not another page
      el(
        'span',
        'pp-index__go',
        '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      ),
    );
    const li = el('li');
    li.append(a);
    list.append(li);
  });
}

// phone only (CSS): a block folds behind a button, so five chapters do not run to fifteen
// screens - the outcome, the problem and the mockup carry the chapter, the detail is one tap
// away. On wider screens the button is hidden and the block always shows.
function fold(block, id, closed, opened) {
  const btn = el('button', 'pp-tool__more', closed);
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  block.id = id;
  block.classList.add('pp-fold');
  btn.setAttribute('aria-controls', id);
  btn.addEventListener('click', () => {
    const open = block.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? opened : closed;
  });
  return btn;
}

function buildChapter(host, tool) {
  const bullets = el('ul', 'pp-tool__bullets');
  tool.bullets.forEach((b) => bullets.append(el('li', null, rich(b))));
  const n = tool.bullets.length;
  const moreBullets = fold(bullets, `${tool.id}-points`, `Show all ${n} points`, 'Hide the points');
  const idea = el('p', 'pp-tool__idea', rich(tool.idea));
  const moreIdea = fold(idea, `${tool.id}-idea`, 'Read how it works', 'Hide it');

  const highlights = el('ul', 'pp-tool__highlights');
  (tool.highlights || []).forEach((h) => {
    const li = el('li');
    if (h.icon) li.append(icon(h.icon, 18)); // no mark in public/icons: text-only pill
    li.append(document.createTextNode(h.label));
    if (h.title) li.title = h.title;
    highlights.append(li);
  });

  host.append(
    el('h2', null, rich(tool.name)),
    ...(tool.highlights ? [highlights] : []),
    // the outcome first: a reader with a minute per page should leave with it
    ...(tool.result
      ? [el('p', 'pp-tool__label', 'What changed'), el('p', 'pp-tool__result', rich(tool.result))]
      : []),
    el('p', 'pp-tool__label', 'The problem'),
    el('p', 'pp-tool__problem', rich(tool.problem)),
    el('p', 'pp-tool__label', 'What it does'),
    moreBullets,
    bullets,
    el('p', 'pp-tool__label', 'The interesting part'),
    moreIdea,
    idea,
    Object.assign(el('a', 'pp-tool__top', '\u2191 All five tools'), { href: '#tools' }),
  );
}

// View section: step through fake colorways, the one interaction the real
// panel is best at showing. Lens tint + dots only, no product imagery.
const COLORWAYS = [
  ['MODEL_A01 · Colorway 01', 'rgba(30, 30, 30, 0.75)'],
  ['MODEL_A01 · Colorway 02', 'rgba(140, 95, 55, 0.55)'],
  ['MODEL_A01 · Colorway 03', 'rgba(60, 115, 160, 0.55)'],
  ['MODEL_A02 · Colorway 01', 'rgba(95, 140, 85, 0.55)'],
  ['MODEL_A02 · Colorway 02', 'rgba(185, 85, 100, 0.5)'],
];

function initView(view) {
  const name = view.querySelector('.pp-view__name');
  const glasses = view.querySelector('.pp-view__glasses');
  const dots = view.querySelector('.pp-view__dots');
  COLORWAYS.forEach(() => dots.append(el('i')));
  let i = 0;
  const show = () => {
    name.textContent = COLORWAYS[i][0];
    glasses.style.setProperty('--lens', COLORWAYS[i][1]);
    [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === i));
  };
  view.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    i = (i + Number(btn.dataset.step) + COLORWAYS.length) % COLORWAYS.length;
    show();
  });
  show();
}

// The redrawn UIs answer the pointer the way the real ones would, one
// delegated listener per window: tabs swap their panel, checkboxes and segmented
// controls toggle, tree nodes pick, and a [data-run] button plays a short fake
// run (label -> busy -> done -> back) so the action reads as doing something.
// Pure theatre on fake data: the mockups stay aria-hidden, the copy beside
// them carries the content.
const RUN_MS = 900;
const DONE_MS = 1400;

function run(btn) {
  if (btn.classList.contains('is-running') || btn.classList.contains('is-done')) return;
  const label = btn.innerHTML;
  const setText = (text) => {
    // keep a leading icon (svg or swatch) in place, swap only the words
    const lead = btn.querySelector('svg, .pp-swatch');
    btn.textContent = text;
    if (lead) btn.prepend(lead);
  };
  btn.style.minWidth = `${btn.offsetWidth}px`;
  btn.classList.add('is-running');
  setText(btn.dataset.run);
  setTimeout(() => {
    btn.classList.replace('is-running', 'is-done');
    setText(btn.dataset.done);
    setTimeout(() => {
      btn.classList.remove('is-done');
      btn.innerHTML = label;
      btn.style.minWidth = '';
    }, DONE_MS);
  }, RUN_MS);
}

function syncRenamePreview(win) {
  const out = win.querySelector('[data-rename-preview]');
  const picked = win.querySelector('.pp-tree .is-picked');
  if (!out || !picked) return;
  const part = picked.closest('ul').parentElement.firstChild.textContent.trim();
  const node = picked.textContent.replace(/\s+(\w)/g, (_, c) => c.toUpperCase());
  const suffix = [...win.querySelectorAll('.pp-chk.is-on')].map((c) => c.textContent.trim());
  out.textContent = [part, node, ...suffix].join('_');
}

function initMockup(win) {
  win.addEventListener('click', (e) => {
    const t = e.target;

    const tab = t.closest('.pp-tabs > span');
    if (tab) {
      tab.parentElement
        .querySelectorAll(':scope > span')
        .forEach((s) => s.classList.toggle('is-on', s === tab));
      if (tab.dataset.tab) {
        win
          .querySelectorAll('[data-panel]')
          .forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.tab));
      }
      return;
    }

    const seg = t.closest('.pp-seg > span');
    if (seg) {
      seg.parentElement
        .querySelectorAll(':scope > span')
        .forEach((s) => s.classList.toggle('is-on', s === seg));
      return;
    }

    const check = t.closest('.pp-check, .pp-chk');
    if (check) {
      check.classList.toggle('is-on');
      syncRenamePreview(win);
      return;
    }

    const leaf = t.closest('.pp-tree ul li, .pp-table li:not(.pp-table__head)');
    if (leaf && !leaf.querySelector('.pp-check')) {
      leaf.parentElement
        .closest('.pp-tree, .pp-table')
        .querySelectorAll('.is-picked')
        .forEach((n) => n.classList.remove('is-picked'));
      leaf.classList.add('is-picked');
      syncRenamePreview(win);
      return;
    }

    const btn = t.closest('span.pp-btn');
    if (!btn) return;
    if (btn.dataset.run) {
      run(btn);
    } else {
      btn.classList.remove('is-hit');
      void btn.offsetWidth; // restart the flash on a repeat click
      btn.classList.add('is-hit');
    }
  });
}

// the page's cover next to the intro: inert copies of the real mockups, so the
// drawing lives in one place and the cover can never drift from the chapters
function buildCollage(host) {
  ['.pp-omni', '.pp-maya', '.pp-unreal'].forEach((sel) => {
    const win = document.querySelector(`.pp-tool__ui ${sel}`)?.cloneNode(true);
    if (!win) return;
    win.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    win.removeAttribute('role');
    win.removeAttribute('aria-label');
    win.inert = true;
    host.append(win);
  });
}

// A rail down the left edge, once the reader is inside the chapters: the five tools stay one
// click away instead of back up at the index, and the one being read is lit. Wide screens only
// (it lives in the gutter), and it is a plain list of links, so it needs no keyboard path.
function buildRail(tools) {
  const nav = el('nav', 'pp-rail');
  nav.setAttribute('aria-label', 'Tools');
  const list = el('ul');
  const links = new Map();
  tools.forEach((tool) => {
    const a = el('a');
    a.href = `#${tool.id}`;
    const name = rich(tool.name);
    const plain = el('span', 'pp-rail__name', name);
    a.append(icon(tool.icon, 22), plain);
    a.setAttribute('aria-label', plain.textContent);
    const li = el('li');
    li.append(a);
    list.append(li);
    links.set(tool.id, a);
  });
  nav.append(list);
  document.body.append(nav);

  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
      links.forEach((a, id) => {
        const on = seen.has(id);
        // a chapter just reached shows its name for a moment: three of the five icons look alike
        if (on && !a.classList.contains('is-on')) {
          a.classList.add('is-flash');
          clearTimeout(a._flash);
          a._flash = setTimeout(() => a.classList.remove('is-flash'), 1800);
        }
        a.classList.toggle('is-on', on);
      });
      nav.classList.toggle('is-shown', seen.size > 0);
    },
    // a thin band across the middle of the screen: the chapter under the reader's eye
    { rootMargin: '-45% 0px -45% 0px' },
  );
  tools.forEach((tool) => {
    const sec = document.getElementById(tool.id);
    if (sec) io.observe(sec);
  });
}

export function initPipelineProjects() {
  document.querySelectorAll('.pp-win').forEach(initMockup);
  const collage = document.querySelector('.pp-collage');
  if (collage) buildCollage(collage);
  const { tools } = content.pipelineProjects;
  const index = document.querySelector('#pp-index');
  if (index) buildIndex(index, tools);
  buildRail(tools);
  tools.forEach((tool) => {
    const host = document.querySelector(`.pp-tool__text[data-tool="${tool.id}"]`);
    if (host) buildChapter(host, tool);
  });
  const view = document.querySelector('#pp-view');
  if (view) initView(view);
}
