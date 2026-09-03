# lucascattolin.com

Personal portfolio site for Luca Scattolin — 3D technical artist & creative technologist.

Live: https://lucascattolin.com

## Stack

Vite + vanilla JS/CSS + GSAP + Three.js. No framework.

- 3D hero: floating icons built from Draco-compressed GLB models, custom drag/spin interaction, real-time gaussian blur on focus
- Animation: GSAP + ScrollTrigger + SplitText for scroll reveals and text effects
- Fonts: self-hosted Space Grotesk (display) and Switzer (body)

## Pages

Multi-page Vite build (`vite.config.js`):

- `index.html` — home (hero, about, skills, projects, contact)
- `vivatech.html` — Vivatech project case study
- `project-two.html`, `homelab.html` — additional project pages

## Running locally

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

## Deployment

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
