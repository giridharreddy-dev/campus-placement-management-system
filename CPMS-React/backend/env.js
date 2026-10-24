import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'node:fs';

// Ensure dotenv finds the .env file in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// A standalone CPMS checkout uses its own .env; the existing repository keeps
// using the root .env when no CPMS-local file is present.
const localEnv = path.join(__dirname, '../.env');
dotenv.config({ path: existsSync(localEnv) ? localEnv : path.join(__dirname, '../../../.env') });
