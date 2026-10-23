import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { defineConfig } from 'vite';

// "Updated October 2026" in the footer (main.js): the date of the last commit, read at build
// time, so it can never go stale or be forgotten. A VITE_-prefixed variable set here is what
// Vite exposes to the page as import.meta.env.VITE_SITE_UPDATED.
try {
  process.env.VITE_SITE_UPDATED = execFileSync('git', ['log', '-1', '--format=%cs'], {
    encoding: 'utf8',
  }).trim();
} catch {
  // no git (a tarball build): the footer simply shows no date
}

// base '/' — site is served from the custom domain root (lucascattolin.com), not a repo-name subpath
export default defineConfig({
  base: '/',
  build: {
    // hero3d-*.js and draco_decoder-*.js exceed the default 500kB warning, but both
    // are already their own chunk loaded via a dynamic import() in main.js (skipped
    // entirely under prefers-reduced-motion) — real cost only lands on visitors who
    // see the 3D hero, so raise the ceiling instead of splitting an already-lazy chunk further
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      input: {
        main: 'index.html',
        vivatech: 'vivatech.html',
        homelab: 'homelab.html',
        companyBrain: 'company-brain.html',
        pipelineProjects: 'pipeline-projects.html',
        notFound: '404.html',
        privacy: 'privacy.html',
      },
    },
  },
});
