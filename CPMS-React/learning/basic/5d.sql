-- MySQL Workbench: File > Open SQL Script > select this file.
-- Run 5a and 5b first, then execute this script with the lightning button.
-- File > Save Script As saves a reusable .sql script.
USE cpms_syllabus_basic;
SELECT a.id, s.name AS student, c.name AS company, a.status
FROM applications a
JOIN students s ON s.id = a.student_id
JOIN companies c ON c.id = a.company_id
ORDER BY a.id;
SELECT status, COUNT(*) AS total FROM applications GROUP BY status;
