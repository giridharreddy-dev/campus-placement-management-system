// Mounted at /basic/4c by learning/server/app.mjs.
import { Router } from 'express';
export default function createRouter() {
  const router = Router();
  router.get('/', (req, res) =>
    res.send(
      '<!DOCTYPE html><html lang="en"><meta charset="UTF-8"><title>Browser console</title><h1>Open Developer Tools (F12), then Console</h1><script>console.log("Hello World!");</script></html>',
    ),
  );
  return router;
}
