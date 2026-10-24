import dotenv from 'dotenv';
import { createTeachingApp } from './app.mjs';

dotenv.config({ path: new URL('./.env', import.meta.url), quiet: true });
const app = await createTeachingApp();
const server = app.listen(5010, '127.0.0.1', () => console.log('Syllabus teaching server: http://127.0.0.1:5010 (sandbox only)'));
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
