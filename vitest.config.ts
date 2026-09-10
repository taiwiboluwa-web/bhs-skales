import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'client', // Add this if your source files and working index.html live in client/
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
