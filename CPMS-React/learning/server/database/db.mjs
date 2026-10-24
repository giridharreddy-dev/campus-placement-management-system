import mysql from 'mysql2/promise';

export function syllabusPool(mode) {
  if (!['basic', 'case'].includes(mode)) throw new Error('Invalid syllabus database mode');
  if (!process.env.SYLLABUS_DB_USER) throw new Error('Set SYLLABUS_DB_USER and SYLLABUS_DB_PASSWORD; initialize the syllabus databases using database.sql');
  // No configurable database name: this driver cannot select cpms or cpms_test.
  return mysql.createPool({
    host: process.env.SYLLABUS_DB_HOST || 'localhost',
    port: Number(process.env.SYLLABUS_DB_PORT || 3306),
    user: process.env.SYLLABUS_DB_USER,
    password: process.env.SYLLABUS_DB_PASSWORD || '',
    database: `cpms_syllabus_${mode}`,
    connectionLimit: 2,
  });
}
