// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2019',
    sourcemap: true,
  },
  resolve: {
    // Do NOT alias 'react' to index.js – it breaks subpaths.
    alias: {
      // Only alias the jsx runtime to a single place (optional but safe)
      'react/jsx-runtime': path.resolve(
        __dirname,
        'node_modules/react/jsx-runtime.js'
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: { target: 'es2019' },
  },
});
