import '../backend/env.js';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

if (!process.argv.includes('--initialize-case-study'))
  throw new Error('Pass --initialize-case-study to create the separate classroom database.');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
try {
  const [databases] = await connection.execute(
    'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    ['cpms_case_study'],
  );
  const [users] = await connection.execute('SELECT User FROM mysql.user WHERE User = ?', [
    'cpms_case_study_user',
  ]);
  const environment = new URL('../case-study/.env', import.meta.url);
  const exists = await fs.access(environment).then(
    () => true,
    () => false,
  );
  if (databases.length || users.length || exists)
    throw new Error(
      'Case-study database, account or .env already exists. Existing data will not be reset.',
    );
  const sql = await fs.readFile(
    new URL('../case-study/experiment5/database/database.sql', import.meta.url),
    'utf8',
  );
  await connection.query(sql);
  const password = randomBytes(24).toString('hex');
  await connection.query("CREATE USER 'cpms_case_study_user'@'localhost' IDENTIFIED BY ?", [
    password,
  ]);
  await connection.query(
    "GRANT SELECT ON cpms_case_study.students TO 'cpms_case_study_user'@'localhost'",
  );
  await connection.query(
    "GRANT SELECT, INSERT, UPDATE, DELETE ON cpms_case_study.applications TO 'cpms_case_study_user'@'localhost'",
  );
  await fs.writeFile(
    environment,
    `CASE_DB_HOST=${process.env.DB_HOST || 'localhost'}\nCASE_DB_PORT=${process.env.DB_PORT || 3306}\nCASE_DB_USER=cpms_case_study_user\nCASE_DB_PASSWORD=${password}\n`,
    { flag: 'wx' },
  );
  console.log(
    'Created cpms_case_study with 3 students and 2 applications. Its scoped account is stored only in case-study/.env. No cpms tables were changed.',
  );
} finally {
  await connection.end();
}
