import '../backend/env.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { readFile } from 'node:fs/promises';

// Explicit opt-in only. This command never initializes the existing cpms DB.
if (!process.argv.includes('--initialize-demo') || process.env.DB_NAME !== 'cpms_portfolio') {
  throw new Error('Demo initialization requires --initialize-demo and DB_NAME=cpms_portfolio. The existing cpms database is never seeded by this tool.');
}
const passwords = ['STUDENT', 'RECRUITER', 'ADMIN'].map((role) => process.env[`SEED_${role}_PASSWORD`]);
if (passwords.some((value) => !value || value.length < 12) || new Set(passwords).size !== 3) throw new Error('Set three distinct SEED_*_PASSWORD values, each at least 12 characters.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', multipleStatements: true });
try {
  const [tables] = await db.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'cpms_portfolio'");
  if (tables.length) throw new Error('cpms_portfolio already contains tables. Refusing to reset or reseed it.');
  await db.query('CREATE DATABASE IF NOT EXISTS cpms_portfolio');
  await db.query('USE cpms_portfolio');
  const schema = (await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'))
    .replace('CREATE DATABASE IF NOT EXISTS cpms;', '').replace('USE cpms;', '');
  await db.query(schema);
  const workspaceSchema = await readFile(new URL('../database/workspace.sql', import.meta.url), 'utf8');
  await db.query(workspaceSchema);
  const accounts = [
    ['rahul.sharma@university.edu', 'STUDENT', 'STU001', null],
    ['recruiter.techcorp@placement.edu', 'RECRUITER', null, 1],
    ['admin@placement.edu', 'ADMIN', null, null],
  ];
  for (const [index, [email, role, studentId, companyId]] of accounts.entries()) {
    await db.execute('INSERT INTO users (email, password_hash, role, student_id, company_id) VALUES (?, ?, ?, ?, ?)', [email, await bcrypt.hash(passwords[index], 12), role, studentId, companyId]);
  }
  console.log('Created cpms_portfolio with clearly labeled local demo accounts and sample placement data. No existing cpms data was changed.');
} finally { await db.end(); }
