# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio site for Luca Scattolin (English content), deployed to GitHub Pages. Stack: Vite + vanilla JS/CSS + GSAP + Three.js. No framework — do not introduce React/Vue/etc.

- Repo: https://github.com/luc4scatto/Personal_Site (public)
- Live: https://luc4scatto.github.io/Personal_Site/
- Every push to `main` auto-deploys via the Pages workflow (source: GitHub Actions, already enabled)
- **Push policy: never commit/push without Luca's explicit OK** — he reviews on the dev server first
- Two pages (Vite MPA, inputs in vite.config.js): `index.html` (home) and `vivatech.html` (Vivatech project page: cover, description, video, masonry gallery, LinkedIn links)

## Commands

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally (verifies the GitHub Pages base path)

## Architecture

- `index.html` — home sections (hero with 3D canvas, marquee ribbon, about, skills with brand icons, projects, contact). Marquee = per-word `<span>`s duplicated once for the seamless CSS loop; keep an even word count per half or the color alternation jumps at the seam
- `src/main.js` — entry point: nav highlighting, GSAP init, card spotlight (`--mx/--my` custom props), lazy dynamic import of hero3d.js (skipped if `prefers-reduced-motion`)
- `src/animations.js` — GSAP + ScrollTrigger + SplitText animations (hero masked-line reveal, h2 clip reveals, scroll reveals, scroll progress bar, magnetic buttons)
- `src/hero3d.js` — Three.js floating 3D hobby icons: 19 items from Draco GLBs (one is loaded twice) + ~110 small decorative shapes. No-overlap is guaranteed geometrically (fibonacci-sphere homes, wander < half min home distance) — no physics engine. Materials are replaced at load, cycling three palette colors (lime/white/violet, `COLORS`) per object; within an object, meshes get contrasting lightness shades and every 4th part goes dark metallic for component readability. `side: DoubleSide` (open meshes look holey otherwise). **Interactive**: clicking a model focuses it (raycast via window listeners since the canvas is `pointer-events:none`), scales it up and shows its `DESCRIPTIONS[model]` card (placeholder copy, created in JS, styled `.object-info` in sections.css) while the rest of the scene renders through a real gaussian blur pipeline (layers + render-target ping-pong, `three/addons` blur shaders + `FullScreenQuad`) that's allocated lazily and runs only while focused — idle stays a single render pass. Objects pulse randomly to hint clickability; Esc / × / click-outside close. Drag-to-spin is its own thing — see "Hero cloud: drag interaction" below. Tunables at top of file (SPHERE_RADIUS, WANDER, SIZE_TWEAKS, FOCUS_SCALE, PULSE_AMP, BLUR_STRENGTH, shade offsets)
- `src/styles/base.css` — reset, CSS custom properties (colors, spacing, typography). Change the visual identity here, not in section styles. `--accent` (lime) is the primary; `--accent-2` (violet #a78bfa, same as the 3D scene) is used sparingly: scroll progress gradient, marquee alternation, about-photo gradient, `::selection`, vivatech link arrows
- `src/styles/sections.css` — per-section layout and styles. Breakpoints are **not** one mobile query — see "Responsive breakpoints" below
- `public/models/*.glb` — Draco-compressed models; `public/draco/` holds the decoder files (GLTFLoader.setDRACOLoader wired in hero3d.js)
- `public/icons/`, `public/images/`, `public/video/` — skill brand icons (SVG), Vivatech photos, compressed project video
- `.github/workflows/deploy.yml` — builds and deploys to GitHub Pages on push to main

## Responsive breakpoints

The site used to have a single `700px` query, which left every tablet on the desktop layout. There are now three bands, and **two of them are mirrored in JS** — change one side and you must change the other:

| Query | What it does | JS twin |
| --- | --- | --- |
| `max-width: 700px`, or `max-width: 1024px and (orientation: portrait)` | Hero stacks: the 3D canvas leaves absolute positioning and becomes a flow block under the text | `STACKED_HERO` in `hero3d.js` (camera distance) |
| `max-width: 999px` | Skill detail panel is a centered modal with a blurred backdrop instead of floating beside the grid | `PANEL_MODAL` in `main.js` |
| `max-width: 700px` | Page scroll is locked while a skill panel is open — phones only, where the card covers most of the screen | `SCROLL_LOCK` in `main.js` |
| `min-width: 1000px` | Skills grid drops to 2 columns capped at `32rem`, freeing a gutter the detail panel/ghost card (420px wide) sit in | — |

Tablet specifics:
- **Portrait tablets** (701–1024px): headline is `6.4vw` and `#hero-canvas` is `flex: 1 1 0` — a zero basis, not `auto`, because the `<canvas>` inside is sized by the renderer and an auto basis lets it drive (and keep growing) the band's height. Result: the hero is exactly one screen, no clipped kicker, no sphere off the bottom edge.
- **Landscape tablets/small laptops** (701–1366px): headline drops to `6.2vw` and the text is capped at `26rem` so it never reaches the sphere.
- `.hero .btn` is hidden **only** below 700px — tablets have room for it.

## Skills "ghost card"

`.skill-ghost` (markup in `index.html`, copy in `content.skillsHint`) is a dashed placeholder filling the gutter until a pill is clicked, so the empty right half reads as an invitation. Notes for anyone touching it:

- It is `position: fixed` and gets its horizontal placement from the **existing** `positionSkillPanel()` in `main.js` — the ghost and the real panel must land in the same rectangle, so don't write a second positioning path.
- Visibility is a **rectangle comparison in a throttled scroll handler**, not an IntersectionObserver: an observer fires as soon as the section touches the observed band, which made the card appear next to the About photo. `cardSlotInSection(cardHeight)` answers "is the viewport's middle — where both fixed cards sit — still inside `#skills`, with `GHOST_CLEARANCE` (96px) to spare?".
- **The open detail panel uses the same test**, so above 700px it leaves with the section instead of hanging over About or Projects. One rule, not two to keep aligned. Below 700px the page is scroll-locked instead and the panel stays put.
- Three classes, all set in `main.js`: `is-visible` (scroll position), `is-cramped` (gutter narrower than the card — happens ~1367–1420px, where the grid returns to 3 columns), `is-dismissed` (a real panel took the slot).
- Below 1000px it is `display: none` in CSS, not JS, so no stuck class can ever render it on a phone.
- The panel carries `transition-delay: 0.16s` **on open only** so the ghost has time to dissolve first; that delay is zeroed in the `max-width: 999px` block and in `is-switching`. The media query alone does not win against `.skill-panel.is-open`, so the reset needs the same specificity.

## Hero cloud: drag interaction

Press and drag the canvas to spin the cloud. Three things here are the way they are because
the obvious version was tried and failed — don't "simplify" them back:

- **Rotation is a quaternion, premultiplied.** Euler angles put the world Y axis opposite
  to the screen's once the cloud is flipped past vertical, so dragging sideways rotated the
  wrong way. Premultiplying by a screen-space axis (`rotateWorld()`) keeps "drag right" =
  "spin right" in any orientation. Idle spin and mouse parallax are composed *outside* the
  manual rotation, so they stay screen-relative.
- **The tilt unwinds at rest** (`settleRoll()`). Composing rotations about two axes breeds
  rotation about the third, so the horizon drifts — ~12° over a long session, unbounded, and
  the scene becomes unreadable. Constraining the drag instead would cost a pole where
  sideways dragging stops working, so the tilt is allowed and then undone (6%/frame, ~1s)
  only once the cloud is at rest. Weighted by how visible the up axis is, so it fades out
  near the pole where "upright" is undefined. Note the sign: `atan2(x, y)` measures
  clockwise, a rotation about +Z goes counter-clockwise — getting this backwards amplifies
  the tilt instead of removing it.
- **The smear is fake motion blur**: no velocity buffer, no second geometry pass. It reuses
  the focus blur pipeline with the per-axis radius driven by how much rotation was applied
  that frame (`appliedY`/`appliedX` — euler deltas would spike near the poles). Two
  fullscreen passes, only while moving; idle stays a single pass. Measured cost during a
  drag at 1024x1366 with 4x CPU throttling: unchanged, 16.67ms/frame.

Feel is tuned by three constants at the top of the file: `DRAG_BLUR` (1.6 — the ceiling is
~2.5, past which the 9-tap addon shaders show banding instead of a smear), `SPIN_FRICTION`
(0.96, velocity kept per frame after release — 0.98 ≈ 3s, 0.93 ≈ half a second) and
`ROLL_FIX` (0.06).

## 3D model pipeline

Current homepage models are external GLB assets. Raw uncompressed sources (~29MB) live in `_originals/new_models_raw/` — gitignored, never commit or move into `public/`. To (re)optimize one into the site:

```
npx @gltf-transform/cli optimize _originals/new_models_raw/<name>.glb public/models/<name>.glb --compress draco
```

This welds/simplifies/prunes and Draco-compresses (~29MB raw → ~70KB–180KB per file). Materials get replaced at runtime by hero3d.js, so texture/material loss is irrelevant. If simplification visibly damages a mesh, re-run with `--simplify false`. New model = optimize it into `public/models/` + add its name to GLB_MODELS in hero3d.js.

Legacy Blender pipeline (previous models, kept for reference): `_originals/3d_files.blend` (183MB, gitignored) exported via `tools/export_glb.py` (per-mesh decimation caps in `FILE_CAPS`, modifiers stripped, placeholder materials, Draco). Run: `/Applications/Blender.app/Contents/MacOS/blender -b --factory-startup -noaudio _originals/3d_files.blend --python tools/export_glb.py`.

## Constraints

- `vite.config.js` sets `base: '/Personal_Site/'` to match the repo name — change only if the repo is renamed
- All animations must respect `prefers-reduced-motion`
- Mobile-first responsive; heavy animations are simplified or disabled on small viewports. Verify layout changes at real device sizes (iPad mini 744, iPad Air 820, iPad Pro 1024 portrait, 1180/1366 landscape, phone 390, desktop 1440) — Chrome DevTools emulation, since the browser window can't be made taller than the screen
- Site copy is real (Thélios/Vivatech content) except the two placeholder project cards ("Project Two/Three") awaiting Luca's details
