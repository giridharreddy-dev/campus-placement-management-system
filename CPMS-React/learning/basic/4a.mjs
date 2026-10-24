// Mounted at /basic/4a by learning/server/app.mjs.
import { Router } from 'express';
export default function createRouter() {
  const router = Router();
  router.get('/', (req, res) => res.type('text').send('Hello World!'));
  return router;
}
