// A nested CPMS install must share the host project's React runtime. In the
// standalone ZIP there is no host package, so its own dependencies are used.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = path.resolve(root, '../..');
try { await fs.access(path.join(host, 'package.json')); } catch { process.exit(0); }
const requireHost = createRequire(path.join(host, 'package.json'));
const modules = path.join(root, 'node_modules');
for (const name of ['react', 'react-dom']) {
  let target;
  try { target = path.dirname(requireHost.resolve(`${name}/package.json`)); } catch { continue; }
  const local = path.join(modules, name);
  try { if (await fs.realpath(local) === await fs.realpath(target)) continue; } catch { /* Not yet linked. */ }
  const backup = path.join(modules, '.cache', 'host-react', `${name}-${Date.now()}`);
  // Validate both move endpoints before moving any Windows directory.
  for (const location of [local, backup]) {
    const relative = path.relative(modules, path.resolve(location));
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Dependency path escaped CPMS/node_modules');
  }
  await fs.mkdir(path.dirname(backup), { recursive: true });
  try { await fs.rename(local, backup); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.symlink(target, local, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`CPMS shares the repository's ${name} runtime.`);
}
