// Mounted at /case/4e by learning/server/app.mjs.
import { Router } from 'express';
import { syllabusPool } from '../server/database/db.mjs';
export default function createRouter() {
  const router = Router();
  router.get('/', async (req, res, next) => {
    let pool;
    try {
      pool = syllabusPool('case');
      const [rows] = await pool.execute(
        'SELECT id, name, cgpa FROM students ORDER BY id',
      );
      res.json({ database: 'cpms_syllabus_case', students: rows });
    } catch (error) {
      next(error);
    } finally {
      if (pool) await pool.end();
    }
  });
  return router;
}
