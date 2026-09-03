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

## Before pushing

`deploy.yml` gates the build on lint + format — a broken push won't deploy. If you hand-edit any `.js`/`.css` file, run before pushing:

```bash
npm run lint            # catches real bugs (undefined refs, unused vars)
npm run format:check    # reports formatting issues
npx prettier --write .  # auto-fixes formatting (JS/CSS only — HTML is intentionally excluded, see .prettierignore)
```

Editing copy in `src/content.js` or plain text in the `.html` files doesn't need this — only relevant if you touch code structure.

## Deployment

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
