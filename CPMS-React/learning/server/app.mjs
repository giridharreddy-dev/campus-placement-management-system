import express from 'express';

export async function createTeachingApp({ adviceUrl = 'http://127.0.0.1:5011/advice' } = {}) {
  const app = express();
  app.use((req, res, next) => {
    // Local classroom frontend only. No credentials are accepted or forwarded.
    const origin = req.headers.origin;
    if (origin && /^http:\/\/(localhost|127\.0\.0\.1):(5173|5174|4173|4174)$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  app.get('/', (req, res) => res.send('<!DOCTYPE html><html lang="en"><meta charset="UTF-8"><title>CPMS teaching server</title><h1>FSD syllabus server</h1><p>Sandbox data only. Use /basic/4a to /basic/4e and /case/4a to /case/4e.</p><a href="http://localhost:5173/syllabus">Open the learning lab</a></html>'));
  for (const mode of ['basic', 'case']) {
    app.get(`/${mode}/3b`, (req, res) => res.json(mode === 'case' ? [{ id: 1, name: 'Practice software drive' }, { id: 2, name: 'Practice analyst drive' }] : [{ id: 1, name: 'First API item' }, { id: 2, name: 'Second API item' }]));
    for (const id of ['4a', '4b', '4c', '4d', '4e']) {
      const { default: createRouter } = await import(new URL(`../${mode}/${id}.mjs`, import.meta.url));
      app.use(`/${mode}/${id}`, createRouter());
    }
  }
  app.get('/case/architecture', async (req, res) => {
    try {
      const response = await fetch(adviceUrl, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) throw new Error('Advice service unavailable');
      res.json({ architecture: 'Two independent Node processes communicating over HTTP', advice: await response.json() });
    } catch {
      res.status(503).json({ error: 'Advice service unavailable. Start node src/CPMS-React/learning/server/advice-service.mjs on port 5011.' });
    }
  });
  app.use((req, res) => res.status(404).json({ error: 'Syllabus route not found' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const badRequest = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    res.status(badRequest ? 400 : 503).json({ error: badRequest ? 'Invalid JSON body or body too large' : 'Teaching database unavailable. Check SYLLABUS_DB_USER, SYLLABUS_DB_PASSWORD and run database.sql.' });
  });
  return app;
}
