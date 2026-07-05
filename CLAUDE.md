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

- `index.html` — home sections (hero with 3D canvas, about, skills with brand icons, projects, contact)
- `src/main.js` — entry point: nav highlighting, GSAP init, lazy dynamic import of hero3d.js (skipped if `prefers-reduced-motion`)
- `src/animations.js` — GSAP + ScrollTrigger animations (scroll reveals, staggers)
- `src/hero3d.js` — Three.js floating 3D hobby icons: 10 Draco GLBs + ~110 small decorative spheres. No-overlap is guaranteed geometrically (fibonacci-sphere homes, wander < half min home distance) — no physics engine. Materials are replaced at load: palette colors with per-mesh lightness shades, `side: DoubleSide` (open meshes look holey otherwise). Tunables at top of file (SPHERE_RADIUS, WANDER, SIZE_TWEAKS, shade offsets)
- `src/styles/base.css` — reset, CSS custom properties (colors, spacing, typography). Change the visual identity here, not in section styles
- `src/styles/sections.css` — per-section layout and styles
- `public/models/*.glb` — Draco-compressed models; `public/draco/` holds the decoder files (GLTFLoader.setDRACOLoader wired in hero3d.js)
- `public/icons/`, `public/images/`, `public/video/` — skill brand icons (SVG), Vivatech photos, compressed project video
- `.github/workflows/deploy.yml` — builds and deploys to GitHub Pages on push to main

## 3D model pipeline

Source of truth: `_originals/3d_files.blend` (183MB, **gitignored — never commit**; GitHub rejects files >100MB). Re-export after editing it:

```
/Applications/Blender.app/Contents/MacOS/blender -b --factory-startup -noaudio \
  _originals/3d_files.blend --python tools/export_glb.py
```

The script exports root objects and collections to `public/models/*.glb` with: per-mesh decimation cap (8k polys per mesh in collections, 20k for single-mesh objects — never uniform-ratio decimation, it destroys small parts), Bevel/Subsurf modifiers stripped (they explode poly counts at export), materials as PLACEHOLDER (keeps slots for per-part shading, drops textures), no UVs, Draco compression. New model = add it to the script dicts + to GLB_MODELS in hero3d.js.

## Constraints

- `vite.config.js` sets `base: '/Personal_Site/'` to match the repo name — change only if the repo is renamed
- All animations must respect `prefers-reduced-motion`
- Mobile-first responsive; heavy animations are simplified or disabled on small viewports
- Site copy is real (Thélios/Vivatech content) except the two placeholder project cards ("Project Two/Three") awaiting Luca's details
