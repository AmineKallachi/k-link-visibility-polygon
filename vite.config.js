import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the built site in dist/ also works on GitHub Pages (in a subfolder).
  base: './',
  // p5 alone is ~1 MB; that's fine for this project, so don't warn about it.
  build: { chunkSizeWarningLimit: 2000 },
});
