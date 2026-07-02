# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page personal portfolio site (English content), deployed to GitHub Pages. Stack: Vite + vanilla JS/CSS + GSAP. No framework — do not introduce React/Vue/etc. Three.js/GLB support is planned for a future 3D hero; keep the hero container ready for a canvas but don't add three.js until asked.

## Commands

- `npm run dev` — dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally (verifies the GitHub Pages base path)

## Architecture

- `index.html` — the only page; all sections live here (hero, about, skills, projects, contact)
- `src/main.js` — entry point: wires up nav, smooth scroll, animations
- `src/animations.js` — GSAP + ScrollTrigger animations (scroll reveals, staggers)
- `src/styles/base.css` — reset, CSS custom properties (colors, spacing, typography). Change the visual identity here, not in section styles
- `src/styles/sections.css` — per-section layout and styles
- `public/` — static assets served as-is (favicon, images, future `.glb` models)
- `.github/workflows/deploy.yml` — builds and deploys to GitHub Pages on push to main

## Constraints

- `vite.config.js` sets `base` for GitHub Pages — keep it in sync with the repo name, or `/` if the repo is `<username>.github.io`
- All animations must respect `prefers-reduced-motion`
- Mobile-first responsive; heavy animations are simplified or disabled on small viewports
- Site copy currently uses placeholders; real content will come from a user-provided `.md` file and should replace placeholders in `index.html`
