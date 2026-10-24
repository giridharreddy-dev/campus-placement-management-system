-- Experiment 5a–5e: one placement database program.
-- CLI, from repository root: SOURCE src/CPMS-React/case-study/experiment5/database/database.sql;
-- Workbench: File > Open SQL Script, save the file, then execute with the lightning button.
CREATE DATABASE IF NOT EXISTS cpms_case_study;
USE cpms_case_study;

CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cgpa DECIMAL(4,2) NOT NULL CHECK (cgpa BETWEEN 0 AND 10)
);
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  company VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Applied',
  FOREIGN KEY (student_id) REFERENCES students(id),
  CHECK (status IN ('Applied', 'Shortlisted'))
);
INSERT INTO students VALUES (1, 'Giri', 8.20), (2, 'Priya', 7.40), (3, 'Arun', 6.50)
  ON DUPLICATE KEY UPDATE name = VALUES(name), cgpa = VALUES(cgpa);
INSERT INTO applications (id, student_id, company) VALUES (101, 1, 'Software Ltd'), (102, 2, 'Analytics Ltd')
  ON DUPLICATE KEY UPDATE company = VALUES(company);
UPDATE applications SET status = 'Shortlisted' WHERE id = 101;
SHOW TABLES;

-- Scalar, IN and correlated subqueries.
SELECT name FROM students WHERE cgpa > (SELECT AVG(cgpa) FROM students) ORDER BY id;
SELECT name FROM students WHERE id IN (SELECT student_id FROM applications WHERE status = 'Shortlisted') ORDER BY id;
SELECT s.name FROM students s WHERE EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id) ORDER BY s.id;

-- A report shared with the Express API in Experiment 4.
SELECT s.name, a.company, a.status FROM applications a
JOIN students s ON s.id = a.student_id ORDER BY a.id;
