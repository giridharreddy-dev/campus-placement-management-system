import express from 'express';
import { fileURLToPath } from 'node:url';

export default function createPlacementApp(db) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (/^http:\/\/(localhost|127\.0\.0\.1):(5173|5174|4173|4174)$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  const listing =
    'SELECT a.id, s.name, a.company, a.status FROM applications a JOIN students s ON s.id = a.student_id';
  app.param('id', (req, res, next) =>
    /^[1-9]\d*$/.test(req.params.id)
      ? next()
      : res.status(400).json({ error: 'Use a positive application ID.' }),
  );
  app.get('/', (req, res) => res.sendFile(fileURLToPath(new URL('./index.html', import.meta.url))));
  app.get('/students', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM students ORDER BY id');
    res.json(rows);
  });
  app.get('/applications', async (req, res) => {
    const [rows] = await db.query(listing + ' ORDER BY a.id');
    res.json(rows);
  });
  app.post('/applications', async (req, res) => {
    const { studentId, company } = req.body || {};
    if (
      !Number.isSafeInteger(Number(studentId)) ||
      Number(studentId) < 1 ||
      typeof company !== 'string' ||
      !company.trim() ||
      company.trim().length > 100
    )
      return res
        .status(400)
        .json({ error: 'Choose a student and enter a company (1–100 characters).' });
    const [result] = await db.execute(
      'INSERT INTO applications (student_id, company) VALUES (?, ?)',
      [studentId, company.trim()],
    );
    const [rows] = await db.execute(listing + ' WHERE a.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  });
  app.put('/applications/:id', async (req, res) => {
    if (!['Applied', 'Shortlisted'].includes(req.body?.status))
      return res.status(400).json({ error: 'Use Applied or Shortlisted.' });
    const [result] = await db.execute('UPDATE applications SET status = ? WHERE id = ?', [
      req.body.status,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Application not found.' });
    res.json({ message: 'Application updated.' });
  });
  app.delete('/applications/:id', async (req, res) => {
    const [result] = await db.execute('DELETE FROM applications WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Application not found.' });
    res.json({ message: 'Application deleted.' });
  });
  app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const badInput =
      error.type === 'entity.parse.failed' ||
      error.type === 'entity.too.large' ||
      error.code === 'ER_NO_REFERENCED_ROW_2';
    res
      .status(badInput ? 400 : 503)
      .json({
        error: badInput
          ? 'Invalid request or unknown student.'
          : 'Check the case-study database and server credentials.',
      });
  });
  return app;
}
