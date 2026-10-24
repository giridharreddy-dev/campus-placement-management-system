CREATE DATABASE IF NOT EXISTS cpms;
USE cpms;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  cgpa DECIMAL(4,2),
  branch VARCHAR(50),
  skills VARCHAR(255) DEFAULT 'Java, React, Node.js, SQL',
  status VARCHAR(20) DEFAULT 'Active'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  salary VARCHAR(50),
  ctc VARCHAR(50),
  location VARCHAR(100),
  openings INT DEFAULT 0,
  base_applicants INT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  company_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'Applied',
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_application (student_id, company_id)
) ENGINE=InnoDB;

-- Centralized authentication table (Milestone 2)
-- Role mapping:
--   STUDENT   -> student_id populated, company_id NULL
--   RECRUITER -> company_id populated (supports multiple recruiters per company), student_id NULL
--   ADMIN     -> student_id NULL, company_id NULL
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
) ENGINE=InnoDB;

INSERT IGNORE INTO students (id, name, email, phone, cgpa, branch, skills, status) VALUES 
('STU001', 'Rahul Sharma', 'rahul.sharma@university.edu', '+91-9876543210', 8.5, 'Computer Science', 'Java, React, Node.js, SQL', 'Placed');

INSERT IGNORE INTO companies (id, name, position, salary, ctc, location, openings, base_applicants) VALUES
(1, 'TechCorp', 'Software Engineer', '8.0 LPA', '10.5 LPA', 'Bangalore', 5, 45),
(2, 'DataSystems', 'Data Analyst', '6.5 LPA', '8.0 LPA', 'Pune', 3, 28),
(3, 'CloudTech', 'Full Stack Developer', '9.0 LPA', '11.5 LPA', 'Hyderabad', 4, 52),
(4, 'InnovateSoft', 'DevOps Engineer', '7.5 LPA', '9.8 LPA', 'Mumbai', 2, 20);

