import './env.js';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cpms',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM students LIKE 'skills'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE students ADD COLUMN skills VARCHAR(255) DEFAULT 'Java, React, Node.js, SQL'");
      console.log('Migrated students table: added skills column.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('STUDENT', 'RECRUITER', 'ADMIN') NOT NULL,
        student_id VARCHAR(20) DEFAULT NULL,
        company_id INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
  } catch (err) {
    // Graceful fallback if table does not exist yet
    console.warn('DB schema check notice:', err.message);
  }
}

export default pool;
