import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1024 * 1024, // inline assets up to 1MB as base64
    rollupOptions: {
      output: {
        manualChunks: undefined, // single bundle required by FB Instant Games
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
