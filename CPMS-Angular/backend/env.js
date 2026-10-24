import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const local = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(local)) dotenv.config({path: local, quiet: true});
if (!process.env.DB_NAME || !process.env.DB_NAME.startsWith('cpms_angular_')) {
  throw new Error('Angular requires its own cpms_angular_ database. Run npm run setup first.');
}
