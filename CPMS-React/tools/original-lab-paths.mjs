import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function getFsdLabRoot() {
  if (process.env.FSD_LAB_ROOT) return path.resolve(process.env.FSD_LAB_ROOT);
  const candidates = [
    path.join(os.homedir(), 'Desktop/FSD'),
    path.join(os.homedir(), 'Documents/FSD'),
    path.join(os.homedir(), 'OneDrive/Desktop/FSD'),
  ];
  return candidates.find((folder) => existsSync(path.join(folder, 'Experiment-1'))) || candidates[0];
}
