import esbuild from 'esbuild';
import { argv } from 'process';

const isWatch = argv.includes('--watch');

const buildOptions: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isWatch,
  format: 'iife',
  target: ['chrome90', 'firefox88', 'safari14'],
  outfile: 'dist/widget.js',
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
}
