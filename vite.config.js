import { defineConfig } from 'vite';

// base '/' — site is served from the custom domain root (lucascattolin.com), not a repo-name subpath
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        vivatech: 'vivatech.html',
      },
    },
  },
});
