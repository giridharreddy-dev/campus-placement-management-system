import mysql from 'mysql2/promise';
import process from 'node:process';
import dotenv from 'dotenv';
import createPlacementApp from './app.js';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
const db = mysql.createPool({
  host: process.env.CASE_DB_HOST || 'localhost',
  port: Number(process.env.CASE_DB_PORT || 3306),
  user: process.env.CASE_DB_USER,
  password: process.env.CASE_DB_PASSWORD || '',
  database: 'cpms_case_study',
  connectionLimit: 3,
});
const server = createPlacementApp(db).listen(5020, '127.0.0.1', () =>
  console.log('CPMS case study: http://127.0.0.1:5020'),
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => db.end()));
