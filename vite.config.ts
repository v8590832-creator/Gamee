import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Rewrites built HTML tags so the production bundle launches cleanly both when
 * opened directly via file:// (double-clicking dist/index.html) and when served
 * over HTTPS on Cloudflare Pages or GitHub Pages.
 */
function classicScriptForFileProtocol(): Plugin {
  return {
    name: 'classic-script-for-file-protocol',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '')
        .replace(
          /<script\b([^>]*?)\btype=["']module["']([^>]*?)><\/script>/gi,
          (_match, before, after) => {
            const attrs = `${before} ${after}`
              .replace(/\bcrossorigin(?:=["'][^"']*["'])?/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
            return `<script defer ${attrs}></script>`;
          }
        )
        .replace(/(<link\b[^>]*?)\s*\bcrossorigin(?:=["'][^"']*["'])?/gi, '$1');
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }
  return {
    base: './',
    plugins: [react(), tailwindcss(), classicScriptForFileProtocol()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      target: 'es2022',
      chunkSizeWarningLimit: 1350,
      rollupOptions: {
        output: {
          format: 'iife' as const,
          name: 'BouncebackApp',
          codeSplitting: false,
          entryFileNames: 'assets/bounceback-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
