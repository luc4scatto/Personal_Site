// The detail view for a picked skill: title, self-taught badge, description, bullets, and a
// drawn (not unicode) close icon. Built once per mount point and repopulated on each pick, by
// both the flat wall (src/main.js) and the drawer's open-card panel (src/skillDrawer.js) — the
// two systems stay otherwise independent, but there is no reason to duplicate how a
// content.skills entry becomes this markup.

/** A detached .skill-card__inner, ready to append into any container. */
export function buildSkillCardInner() {
  const inner = document.createElement('div');
  inner.className = 'skill-card__inner';
  inner.innerHTML =
    // drawn, not a unicode glyph: one stroke weight, one line cap, scales with the button
    '<button class="skill-card__close" aria-label="Close">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg></button>' +
    '<h3 class="skill-card__title"></h3>' +
    '<p class="skill-card__badge"></p>' +
    '<p class="skill-card__text"></p>' +
    '<ul class="skill-card__bullets"></ul>';
  return inner;
}

// bullets entries are either a plain string or { label, subs: [] } for a nested group
// (e.g. Substance Painter / Designer under the Substance 3D card)
function renderBullets(list, items) {
  list.innerHTML = '';
  list.hidden = !items || !items.length;
  if (!items) return;
  for (const item of items) {
    const li = document.createElement('li');
    if (typeof item === 'string') {
      li.textContent = item;
    } else {
      li.textContent = item.label;
      const sub = document.createElement('ul');
      for (const s of item.subs ?? []) {
        const subLi = document.createElement('li');
        subLi.textContent = s;
        sub.append(subLi);
      }
      li.append(sub);
    }
    list.append(li);
  }
}

/** Fills a built inner with one content.skills[key] entry. Returns false (and touches
 *  nothing else) if the entry doesn't exist, so callers can bail the same way as before.
 *  Brand color is the caller's own concern (`--brand` is set on whichever element that
 *  caller animates — the outer .skill-card in the flat wall, the panel in the drawer). */
export function applySkillContent(inner, skill) {
  if (!skill) return false;
  inner.querySelector('.skill-card__title').textContent = skill.title;
  const badge = inner.querySelector('.skill-card__badge');
  badge.textContent = skill.selfTaught ? 'Self-taught' : '';
  badge.hidden = !skill.selfTaught;
  inner.querySelector('.skill-card__text').textContent = skill.text;
  renderBullets(inner.querySelector('.skill-card__bullets'), skill.bullets);
  return true;
}
