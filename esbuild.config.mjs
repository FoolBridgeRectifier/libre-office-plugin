import esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { readFileSync } from 'fs';

const watch = process.argv.includes('--watch');
// --sourcemap enables source maps on a one-shot build (used by `npm run build:dev`).
// Dev panels (EngineTestPanel, StylingEnginePanel) are rendered only when sourcemap is true,
// so they are fully tree-shaken out of `npm run build` (production) output.
const forceSourcmap = process.argv.includes('--sourcemap');
const buildMode = watch ? 'development' : 'production';
const sourcemap = watch || forceSourcmap ? 'inline' : false;
// Package.json is read but not used directly - it's available for future use
void JSON.parse(readFileSync('./package.json', 'utf8'));

// Inject CSS as inline styles into the JS bundle
const injectCssPlugin = {
  name: 'inject-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = readFileSync(args.path, 'utf8');
      const processedCss = await postcss([tailwindPostcss()]).process(css, {
        from: args.path,
      });
      const escaped = JSON.stringify(processedCss.css);

      return {
        contents: `
          const style = document.createElement('style');
          style.textContent = ${escaped};
          document.head.appendChild(style);
          export default undefined;
        `,
        loader: 'js',
      };
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@electron/remote',
    '@codemirror/*',
    '@lezer/*',
    'os',
    'path',
    'fs',
  ],
  format: 'cjs',
  target: 'es2020',
  outfile: 'main.js',
  sourcemap,
  platform: 'browser',
  jsx: 'automatic',
  // Keep console output in dev/watch builds; strip it in production build output.
  drop: watch ? [] : ['console'],
  define: {
    'process.env.NODE_ENV': `"${buildMode}"`,
    __SOURCEMAP__: String(!!sourcemap),
  },
  plugins: [injectCssPlugin],
});

if (watch) {
  await ctx.watch();
  console.log('Watching…');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
