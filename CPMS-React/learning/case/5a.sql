-- Run in MySQL Command Line Client: SOURCE C:/path/to/src/CPMS-React/learning/case/5a.sql;
CREATE DATABASE IF NOT EXISTS cpms_syllabus_case;
USE cpms_syllabus_case;
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cgpa DECIMAL(4,2) NOT NULL,
  CHECK (cgpa BETWEEN 0 AND 10)
);
SHOW TABLES;
