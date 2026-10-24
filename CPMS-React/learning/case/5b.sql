USE cpms_syllabus_case;
-- Run 5a first. Named sample records belong only to the syllabus database.
CREATE TABLE IF NOT EXISTS companies (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);
CREATE TABLE IF NOT EXISTS applications (
  id INT PRIMARY KEY,
  student_id INT NOT NULL,
  company_id INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Applied',
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE (student_id, company_id)
);
INSERT INTO students VALUES (1, 'Practice Giri', 8.20), (2, 'Practice Priya', 7.40), (3, 'Practice Arun', 6.50)
  ON DUPLICATE KEY UPDATE name = VALUES(name), cgpa = VALUES(cgpa);
INSERT INTO companies VALUES (1, 'Practice Software Ltd'), (2, 'Practice Analytics Ltd')
  ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO applications VALUES (1, 1, 1, 'Applied'), (2, 2, 2, 'Applied')
  ON DUPLICATE KEY UPDATE status = VALUES(status);
UPDATE applications SET status = 'Shortlisted' WHERE id = 1;
SELECT * FROM applications;
