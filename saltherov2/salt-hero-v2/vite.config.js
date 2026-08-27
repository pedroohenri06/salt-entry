import { defineConfig } from 'vite';

export default defineConfig({
  // Static, framework-free project — Vite's defaults (root = project root,
  // entry = index.html, output = dist/) are all we need.
  build: {
    outDir: 'dist',
  },
});
