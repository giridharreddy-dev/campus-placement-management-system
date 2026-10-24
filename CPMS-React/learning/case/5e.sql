-- Run from MySQL CLI while the current directory is the repository root.
-- Forward slashes work on Windows in MySQL SOURCE commands.
SOURCE src/CPMS-React/learning/case/5a.sql;
SOURCE src/CPMS-React/learning/case/5b.sql;
-- The project database entry point also initializes both teaching databases:
-- SOURCE src/CPMS-React/learning/server/database/database.sql;
SELECT DATABASE() AS initialized_database;
SELECT COUNT(*) AS students FROM students;
