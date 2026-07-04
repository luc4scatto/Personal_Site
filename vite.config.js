import { defineConfig } from 'vite';

// ponytail: base assumes repo name "Personal_Site"; change to '/' if repo becomes <username>.github.io
export default defineConfig({
  base: '/Personal_Site/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        vivatech: 'vivatech.html',
      },
    },
  },
});
