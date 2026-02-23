import esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { argv } from 'process';

const isWatch = argv.includes('--watch');
const distDir = 'dist';

const sharedOptions: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome90', 'firefox88', 'safari14'],
  logLevel: 'info',
};

if (isWatch) {
  const watchOptions: esbuild.BuildOptions = {
    ...sharedOptions,
    minify: false,
    outfile: join(distDir, 'widget.js'),
  };
  const ctx = await esbuild.context(watchOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  const buildOptions: esbuild.BuildOptions = {
    ...sharedOptions,
    minify: true,
    write: false,
  };

  const result = await esbuild.build(buildOptions);
  const outputFiles = result.outputFiles;
  if (!outputFiles || outputFiles.length === 0) {
    throw new Error('esbuild produced no output files');
  }
  const outputFile = outputFiles[0];

  const hash8 = createHash('sha256')
    .update(outputFile.contents)
    .digest('hex')
    .slice(0, 8);

  const hashedFilename = `widget.${hash8}.js`;

  await mkdir(distDir, { recursive: true });

  // Remove any existing hashed widget builds
  const existingFiles = await readdir(distDir);
  const hashedPattern = /^widget\.[a-f0-9]{8}\.js$/;
  for (const file of existingFiles) {
    if (hashedPattern.test(file)) {
      await rm(join(distDir, file));
    }
  }

  await writeFile(join(distDir, hashedFilename), outputFile.contents);
  await writeFile(
    join(distDir, 'manifest.json'),
    JSON.stringify({ widget: hashedFilename }, null, 2) + '\n',
  );

  console.log(`Built: ${join(distDir, hashedFilename)}`);
}
