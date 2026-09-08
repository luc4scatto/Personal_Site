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
- `src/main.js` — entry point: nav highlighting, GSAP init, card spotlight (`--mx/--my` custom props), lazy dynamic import of hero3d.js (skipped if `prefers-reduced-motion`). The `[data-copy]` renderer's `escapeHtml()` escapes `content.js` strings then converts `**word**` to `<strong>` — safe only because that copy is developer-authored, never user input
- `src/styles/sections.css` — `.about-grid p strong` sets the bold-copy color a step below `--text` (`color-mix(in srgb, var(--text) 50%, var(--text-dim))`) so inline emphasis in the About paragraph reads distinct from section headings, not identical to them
- `src/animations.js` — GSAP + ScrollTrigger + SplitText animations (hero masked-line reveal, h2 clip reveals, scroll reveals, scroll progress bar, magnetic buttons)
- `src/hero3d.js` — Three.js floating 3D hobby icons: 19 unique items from Draco GLBs + ~160 small decorative shapes (scale `0.015 + Math.random() ** 1.6 * 0.09` — the power curve skews toward small flecks with only occasional bigger chunks; min spacing 0.1 between shapes and 0.9 from any model home keeps them from ever covering the real objects). No-overlap is guaranteed geometrically (fibonacci-sphere homes, wander < half min home distance) — no physics engine. Materials are replaced at load, cycling three palette colors (lime/white/violet, `COLORS`) per object; within an object, meshes get contrasting lightness shades and every 4th part goes dark metallic for component readability, unless the model has an `isNeutral` override (`recolor()`'s 3rd arg, wired per-model in `addItem`) — `server_console_station` uses one to swap which part reads as structure vs. accent: the front cabinet panels (`server_cabinet` material) go neutral metallic, legs/bolts/lights carry the accent color instead. `side: DoubleSide` (open meshes look holey otherwise). **Interactive**: clicking a model focuses it (raycast via window listeners since the canvas is `pointer-events:none`), scales it up and shows its `DESCRIPTIONS[model]` card (placeholder copy, created in JS, styled `.object-info` in sections.css) while the rest of the scene renders through a real gaussian blur pipeline (layers + render-target ping-pong, `three/addons` blur shaders + `FullScreenQuad`) that's allocated lazily and runs only while focused — idle stays a single render pass. Objects pulse randomly to hint clickability; Esc / × / click-outside close. Drag-to-spin is its own thing — see "Hero cloud: drag interaction" below. Tunables at top of file (SPHERE_RADIUS, WANDER, SIZE_TWEAKS, FOCUS_SCALE, PULSE_AMP, BLUR_STRENGTH, shade offsets)
- `src/styles/base.css` — reset, CSS custom properties (colors, spacing, typography). Change the visual identity here, not in section styles. `--accent` (lime) is the primary; `--accent-2` (violet #a78bfa, same as the 3D scene) is used sparingly: scroll progress gradient, marquee alternation, about-photo gradient, `::selection`, vivatech link arrows
- `src/styles/sections.css` — per-section layout and styles. Breakpoints are **not** one mobile query — see "Responsive breakpoints" below
- `public/models/*.glb` — Draco-compressed models; `public/draco/` holds the decoder files (GLTFLoader.setDRACOLoader wired in hero3d.js)
- `public/icons/`, `public/images/`, `public/video/` — skill brand icons (SVG), Vivatech photos, compressed project video
- `public/fonts/*.woff2` — self-hosted, no Google Fonts CDN and no `preconnect`. **Space Grotesk** is the display voice (one variable file, 300-700); **Switzer** takes every reading role, because a display grotesque set at 17px across a paragraph fights the reader. `'Switzer Fallback'` is Arial with `size-adjust`/`ascent-override` tuned to Switzer's metrics, so the swap window doesn't reflow. Both faces are declared in `base.css`; change the identity through `--font-display` / `--font-body`, never per-section. Switzer is under the ITF Free Font License (Fontshare) - verify the terms still allow self-hosting before a public deploy
- `.github/workflows/deploy.yml` — builds and deploys to GitHub Pages on push to main

## Responsive breakpoints

The site used to have a single `700px` query, which left every tablet on the desktop layout. There are now three bands, and **one of them is mirrored in JS** — change one side and you must change the other:

| Query | What it does | JS twin |
| --- | --- | --- |
| `max-width: 700px`, or `max-width: 1024px and (orientation: portrait)` | Hero stacks: the 3D canvas leaves absolute positioning and becomes a flow block under the text | `STACKED_HERO` in `hero3d.js` (camera distance) |
| `max-width: 560px` | Skill card bullets drop from two columns to one | — |
| `max-width: 700px` | Skill tiles and their marks shrink | — |

The skills section used to have three interlocking queries (999 modal / 700 scroll lock / 1000 grid) plus a JS twin for each. It still has **none**. The drawer's `701px` cut-off lives in exactly one place, `DRAWER_MODE` in `main.js`, and it only decides whether the chunk is fetched at load; the drawer itself is a 3D scene that reframes itself at any size, so there is nothing for CSS to mirror. Resist adding a `701px` query to `sections.css` for it — an earlier attempt did, and it needed a matching guard in the module to clear inline styles the stylesheet could not beat.

Tablet specifics:
- **Portrait tablets** (701–1024px): headline is `6.4vw` and `#hero-canvas` is `flex: 1 1 0` — a zero basis, not `auto`, because the `<canvas>` inside is sized by the renderer and an auto basis lets it drive (and keep growing) the band's height. Result: the hero is exactly one screen, no clipped kicker, no sphere off the bottom edge.
- **Landscape tablets/small laptops** (701–1366px): headline drops to `6.2vw` and the text is capped at `26rem` so it never reaches the sphere.
- `.hero .btn` is hidden **only** below 700px — tablets have room for it.

## Skills: the tool wall

The section is a wall of tool tiles grouped by category. Picking one blurs the rest of the
wall and unfolds its card **in place**, inside the category that owns it — the same "focus
one thing, let the rest recede" grammar as the 3D hero cloud, in CSS instead of WebGL.

This replaced a `position: fixed` panel and, before that, a sticky second column. Both were
deleted for the same reason: the card is now a normal grid item, so there is no positioning
code, no modal and no scroll lock.

**Above 701px the wall is filed into a drawer** (`src/skillDrawer.js`): a long brushed-steel
office drawer seen at three quarters, with the tools filed front-to-back like a card index.

- **The folders are the page's own `<li data-skill>` elements**, carried into a `CSS3DObject`
  each via `CSS3DRenderer`. That choice is the load-bearing one: at three quarters every
  folder sits at a different depth, so a flat DOM strip cannot line up any more, but drawing
  them as billboards in WebGL would cost the text, the focus ring, the keyboard and the
  screen reader. CSS3D keeps real DOM inside the scene's perspective.
- **A folder IS its own detail card.** At rest only the tab shows; picking one unrolls the
  sheet upward and flies the card to the front of the drawer, squared up to the camera.
  There is no separate card and no `#skill-card-slot` in drawer mode.
- The sheet is anchored to the **bottom** of a fixed-size box and only ever grows upward, so
  nothing a visitor reads ever needs to be drawn behind the metal. That matters: a CSS3D
  layer cannot be occluded by the WebGL canvas, and this is what makes the two layers
  co-exist without a second render pass.
- **`cull()` is the reveal, not just a guard.** A CSS3D layer is always painted over the
  WebGL canvas, so a folder still inside the cabinet rides on top of the metal instead of
  being hidden by it. Each folder fades in as it crosses `CAB_MOUTH`, which is why the
  opening reads as the drawer being pulled out of the cabinet rather than the whole index
  sliding along above it. There is deliberately no opacity tween on open — it would fight
  this.
- **Selection moves the card, never the rail.** Sliding the whole index forward to bring the
  chosen folder to the front pushed every folder ahead of it out through the drawer's face.
  `cull()` still hides anything a manual drag pushes past the front lip.
- `fit()` solves the camera distance **numerically**, against the eight corners of what is
  actually on screen. Trigonometry that assumed a front-on camera framed the drawer at about
  half the width it could use, because at three quarters the projected extent depends on the
  azimuth as well as the aspect.
- **The camera is a long lens (17 degrees) on purpose.** At 32 the drawer's front panel
  rendered half again larger than the cabinet face eleven units behind it and the two
  stopped reading as one piece of furniture. Flattening the perspective closes that gap;
  `fit()` re-solves the distance, so nothing else needs touching. `FACE_W` is the single
  width the drawer front, the carcass and every closed front share.
- **The drawer's interior is `MeshBasicMaterial` black**, not dimmed metal. Anything that
  takes light down there catches the environment and reads as a floor again however far it
  is darkened.
- **The cabinet sits behind the drawer's back end, never over it.** A carcass that wrapped
  the drawer would swallow the folders filed at the back. It runs far past the top of the
  frame on purpose: `.drawer__scene canvas` carries a `mask-image` that dissolves the metal
  into the page at both ends, so the cabinet continues up into black rather than stopping on
  a cut edge, and the drawer's underside sinks away instead of floating. Masking the canvas
  rather than fading in the shader is what keeps the CSS3D folders out of it — they are a
  separate layer with no mask.
- `GAP` is at its floor. Below roughly 0.4 each full-width tab covers the label of the one
  behind it, which is what a real index avoids by staggering its tabs sideways.
- Rendering is **on demand**: `pump()` runs a short rAF burst around each interaction and
  then stops. `hero3d.js` by contrast runs its loop for the life of the page.
- `main.js` adds `is-live` to `#skill-drawer` only after the module has initialised, and
  every drawer rule is scoped to it. `initSkillsWall()` is a named function precisely so the
  import's `.catch` can hand the section back to the flat wall.
- The opening reveal uses `gsap.fromTo`, not `from`. A `from` here left the folders parked on
  their start values, and an invisible wall of skills is a worse failure than no animation.

- **Selectors must be direct-child scoped.** The card is injected *inside* `.skills-grid`
  and its title is an `<h3>` inside `.skill-group`. Written as descendant selectors,
  `.skills-grid li` blurred the card's own bullets as if they were tiles, and
  `.skill-group h3` gave the card title the category heading's hairline rule. Use
  `.skills-grid > li` and `.skill-group > h3`.
- **`--brand`** is the tile's own brand color, set per tile in `main.js` from
  `content.skills[key].color`. CSS uses it for the tile's wash (`--tile-wash`: 6% at rest,
  14% on hover, 22% active), the open card's gradient and border, and the bullet dots.
- The category heading is the section's structural device: display scale, riding a hairline
  rule that fades out to the right. It replaced six 0.85rem grey captions.
- `.skill-card__badge` needs its own `[hidden] { display: none }` — `display: inline-block`
  beats the `hidden` attribute, so unflagged cards rendered an empty pill.
- The close control is a **drawn SVG**, not `&times;`, and the tiles carry no `+` glyph.
  Unicode standing in for an icon system is a craft-floor violation.
- Motion is one authored moment: the height unfold plus the wall going soft. Switching tools
  inside the same category re-measures the height instead of unfolding again.

Known, out of scope: `.info-card` (the 3D hero object card, `sections.css:10`) still carries
a `border-left: 3px solid var(--accent)` — the same side-tab tell that was removed from the
skills card. One line to fix when someone touches that component.

## Skill pills and their panels

Pill markup is in `index.html` (`<li data-skill="...">`), copy in `content.skills` in `src/content.js` — the `data-skill` value is the object key, change one and you must change the other.

- Entry shape: `{ title, text, color, selfTaught?, bullets? }`. `color` is the brand color pulled from the icon; `selfTaught: true` renders the badge; `bullets` is a list of strings, or `{ label, subs: [...] }` objects for a nested list (only Substance 3D uses the nested form).
- In the source, every `bullets`/`subs` array is written one entry per line. Keep it that way — Luca reads and edits this list directly.
- **Agentic Workflow** is one pill covering Hermes Agent, Claude Code, OpenClaw and n8n (they used to be two brand pills). Its icon `public/icons/agentic-workflow.svg` is a hand-written generic node-graph glyph, deliberately brandless so it fits all four bullets. `claude-code.svg` is now unused but kept; `hermes-agent.png` was moved to `public/icons/services/` and recolored white-on-transparent for use as the "Hermes Agent" service icon on `homelab.html` (`src/homelabDiagram.js`'s `ICON_OVERRIDES`).
- The **Qt Designer** pill is commented out in `index.html` while its `content.skills` entry stays — uncomment to bring it back.
- The **Audio** category (`index.html`, after 2D Softwares) holds **Ableton Live** — icon is the official simple-icons mark (`public/icons/ableton-live.svg`), recolored white like Unreal Engine since Ableton's brand is monochrome black/white.
- Copy style: use `-`, never an em dash.

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

This welds/simplifies/prunes and Draco-compresses (~29MB raw → ~70KB–180KB per file). Materials get replaced at runtime by hero3d.js, so texture/material loss is irrelevant. If simplification visibly damages a mesh, re-run with `--simplify false`. If the mesh comes apart into one blob with no per-part color variation, re-run with `--join false` too — `optimize`'s default join merges separate meshes sharing a material, and `recolor()` colors per mesh, so joining collapses the whole object to a couple of shades. New model = optimize it into `public/models/` + add its name to GLB_MODELS in hero3d.js.

Sources sometimes arrive as `.fbx` instead of `.glb` (dropped straight into `_originals/`, not `new_models_raw/`). Convert first with headless Blender:

```
/Applications/Blender.app/Contents/MacOS/blender -b --factory-startup -noaudio --python <script.py> -- <in>.fbx _originals/new_models_raw/<name>.glb
```

where `<script.py>` just does `bpy.ops.import_scene.fbx(filepath=...)` then `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB')` — then run the optimize step above as normal.

Legacy Blender pipeline (previous models, kept for reference): `_originals/3d_files.blend` (183MB, gitignored) exported via `tools/export_glb.py` (per-mesh decimation caps in `FILE_CAPS`, modifiers stripped, placeholder materials, Draco). Run: `/Applications/Blender.app/Contents/MacOS/blender -b --factory-startup -noaudio _originals/3d_files.blend --python tools/export_glb.py`.

## Constraints

- `vite.config.js` sets `base: '/'` — the site is served from the custom domain root (lucascattolin.com), not a repo-name subpath. The dev server therefore serves the site at `http://localhost:5173/`, not `/Personal_Site/`; hitting the wrong path still renders the page (HTML fallback) but every model 404s
- All animations must respect `prefers-reduced-motion`
- Mobile-first responsive; heavy animations are simplified or disabled on small viewports. Verify layout changes at real device sizes (iPad mini 744, iPad Air 820, iPad Pro 1024 portrait, 1180/1366 landscape, phone 390, desktop 1440) — Chrome DevTools emulation, since the browser window can't be made taller than the screen
- Site copy is real (Thélios/Vivatech content) except the two placeholder project cards ("Project Two/Three") awaiting Luca's details
