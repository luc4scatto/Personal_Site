import { defineConfig } from 'vite';

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
        projectTwo: 'project-two.html',
        homelab: 'homelab.html',
        notFound: '404.html',
        privacy: 'privacy.html',
      },
    },
  },
});
