-- Additive workspace extension. Existing core tables and records are unchanged.
CREATE TABLE IF NOT EXISTS career_profiles (
  student_id VARCHAR(20) PRIMARY KEY,
  headline VARCHAR(120) NOT NULL DEFAULT '',
  github VARCHAR(300) NOT NULL DEFAULT '',
  linkedin VARCHAR(300) NOT NULL DEFAULT '',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_details (
  company_id INT PRIMARY KEY,
  work_mode VARCHAR(20) NOT NULL DEFAULT '',
  deadline DATE DEFAULT NULL,
  tags TEXT NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  created_by INT NOT NULL,
  kind ENUM('official', 'personal') NOT NULL,
  title VARCHAR(100) NOT NULL,
  scheduled_at DATETIME NOT NULL COMMENT 'UTC',
  venue VARCHAR(300) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX interview_time (scheduled_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workspace_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  detail VARCHAR(1000) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX user_updates (user_id, created_at)
) ENGINE=InnoDB;
