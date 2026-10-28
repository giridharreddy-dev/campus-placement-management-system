import { spawnSync } from 'node:child_process';
import { copyFile, writeFile, readFile } from 'node:fs/promises';
const result = spawnSync(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.demo.config.js'],
  { stdio: 'inherit' },
);
if (result.status !== 0) process.exit(result.status || 1);
await copyFile('dist-demo/demo.html', 'dist-demo/index.html');
await writeFile('dist-demo/.nojekyll', '');
const html = await readFile('dist-demo/index.html', 'utf8');
if (!html.includes('CPMS — Interactive browser demo'))
  throw new Error('Demo entry was not built.');
console.log(
  'Static sample workspace is ready in dist-demo. API and database are not included.',
);
