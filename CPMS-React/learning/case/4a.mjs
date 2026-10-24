// Mounted at /case/4a by learning/server/app.mjs.
import { Router } from 'express';
export default function createRouter() {
  const router = Router();
  router.get('/', (req, res) =>
    res
      .type('text')
      .send('Hello World from the Campus Placement Management System!'),
  );
  return router;
}
