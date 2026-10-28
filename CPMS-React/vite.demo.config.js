import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: process.env.DEMO_BASE || '/',
  define: { 'import.meta.env.VITE_STATIC_DEMO': JSON.stringify('true') },
  build: { outDir: 'dist-demo', rolldownOptions: { input: 'demo.html' } },
});
