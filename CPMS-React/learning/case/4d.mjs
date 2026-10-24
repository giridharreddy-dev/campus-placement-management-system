// Mounted at /case/4d by learning/server/app.mjs.
import { Router } from 'express';
import { createApplicationController } from '../server/controllers/applications.mjs';
export default function createRouter() {
  const router = Router();
  const controller = createApplicationController();
  router.get('/', controller.list);
  router.get('/:id', controller.read);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
