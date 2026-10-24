import '../backend/env.js';
import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';

if (!process.argv.includes('--initialize-syllabus')) throw new Error('Pass --initialize-syllabus to create two new practice databases and a read-only teaching API account.');
const envFile = new URL('../learning/server/.env', import.meta.url);
try { await access(envFile); throw new Error('A teaching .env already exists; refusing to overwrite credentials.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true,
});
try {
  const [existing] = await db.query("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN ('cpms_syllabus_basic', 'cpms_syllabus_case')");
  if (existing.length) throw new Error('A syllabus database already exists. Use the manual SQL workflow; this initializer never resets existing databases.');
  const [accounts] = await db.query("SELECT User FROM mysql.user WHERE User = 'cpms_syllabus_reader'");
  if (accounts.length) throw new Error('The syllabus reader account already exists. Refusing to replace it.');
  for (const mode of ['basic', 'case']) {
    for (const experiment of ['5a', '5b']) await db.query(await readFile(new URL(`../learning/${mode}/${experiment}.sql`, import.meta.url), 'utf8'));
  }
  const password = randomBytes(32).toString('hex');
  await db.query("CREATE USER 'cpms_syllabus_reader'@'localhost' IDENTIFIED BY ?", [password]);
  for (const mode of ['basic', 'case']) await db.query(`GRANT SELECT ON cpms_syllabus_${mode}.* TO 'cpms_syllabus_reader'@'localhost'`);
  await writeFile(envFile, `SYLLABUS_DB_HOST=${process.env.DB_HOST || 'localhost'}\nSYLLABUS_DB_PORT=${process.env.DB_PORT || 3306}\nSYLLABUS_DB_USER=cpms_syllabus_reader\nSYLLABUS_DB_PASSWORD=${password}\n`, { flag: 'wx' });
  console.log('Initialized two new syllabus databases (3 students, 2 companies, 2 applications each). Created a SELECT-only local account and learning/server/.env. Existing cpms data was not changed.');
} finally { await db.end(); }
