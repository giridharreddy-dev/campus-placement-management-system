USE cpms_syllabus_basic;
-- Scalar subquery: expected students 1 and 2 (average CGPA = 7.3667).
SELECT id, name, cgpa FROM students
WHERE cgpa > (SELECT AVG(cgpa) FROM students);
-- IN subquery: students who have applied (expected 1 and 2).
SELECT id, name FROM students
WHERE id IN (SELECT student_id FROM applications);
-- Correlated EXISTS: companies with at least one application (expected 1 and 2).
SELECT c.id, c.name FROM companies c
WHERE EXISTS (SELECT 1 FROM applications a WHERE a.company_id = c.id);
