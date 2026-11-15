import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Produces ONE self-contained dist/index.html with all styles, fonts, audio,
 * and game JavaScript bundled inline so it works directly on file:// (double-click)
 * and as a single-file itch.io HTML upload without any external asset folder.
 */
function singleFileSelfContainedBuild(): Plugin {
  let outDir = path.resolve(import.meta.dirname, 'dist');

  return {
    name: 'single-file-self-contained-build',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      const htmlEntry = Object.entries(bundle).find(
        ([fileName, item]) => fileName.endsWith('.html') && item.type === 'asset'
      );
      if (!htmlEntry) return;
      const htmlAsset = htmlEntry[1] as { type: 'asset'; source: string | Uint8Array };
      let html =
        typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : Buffer.from(htmlAsset.source).toString('utf8');

      // Remove modulepreload links and crossorigin attributes
      html = html
        .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '')
        .replace(/(<link\b[^>]*?)\s*\bcrossorigin(?:=["'][^"']*["'])?/gi, '$1');

      // Inline all emitted CSS assets inside <head>
      const cssFileNames: string[] = [];
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && item.type === 'asset') {
          const cssRaw =
            typeof item.source === 'string'
              ? item.source
              : Buffer.from(item.source).toString('utf8');
          const safeCss = cssRaw.replace(/<\/style/gi, '<\\/style');
          const escapedBase = path.basename(fileName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkRegex = new RegExp(
            `<link\\b[^>]*href=["'][^"']*${escapedBase}["'][^>]*>`,
            'i'
          );
          if (linkRegex.test(html)) {
            html = html.replace(linkRegex, () => `<style>${safeCss}</style>`);
          } else {
            const headClose = html.lastIndexOf('</head>');
            if (headClose !== -1) {
              html = `${html.slice(0, headClose)}<style>${safeCss}</style>\n  ${html.slice(headClose)}`;
            }
          }
          cssFileNames.push(fileName);
        }
      }
      for (const name of cssFileNames) {
        delete bundle[name];
      }

      // Inline the IIFE JS bundle directly before </body> so #root exists synchronously
      const jsFileNames: string[] = [];
      const inlinedScripts: string[] = [];
      for (const [fileName, item] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && item.type === 'chunk') {
          const escapedBase = path.basename(fileName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const scriptRegex = new RegExp(
            `<script\\b[^>]*src=["'][^"']*${escapedBase}["'][^>]*><\\/script>\\s*`,
            'gi'
          );
          html = html.replace(scriptRegex, '');
          inlinedScripts.push(item.code.replace(/<\/script/gi, '<\\/script'));
          jsFileNames.push(fileName);
        }
      }
      for (const name of jsFileNames) {
        delete bundle[name];
      }

      if (inlinedScripts.length > 0) {
        const scriptTags = inlinedScripts.map((code) => `<script>${code}</script>`).join('\n');
        const bodyCloseIdx = html.lastIndexOf('</body>');
        if (bodyCloseIdx !== -1) {
          html = `${html.slice(0, bodyCloseIdx)}${scriptTags}\n  ${html.slice(bodyCloseIdx)}`;
        } else {
          html += `\n${scriptTags}`;
        }
      }

      htmlAsset.source = html;
    },
    closeBundle() {
      // Remove redundant dist/assets directory so dist/index.html is visibly standalone
      const assetsDir = path.join(outDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }
  return {
    base: './',
    plugins: [react(), tailwindcss(), singleFileSelfContainedBuild()],
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
