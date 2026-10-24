// Mounted at /case/4b by learning/server/app.mjs.
import { Router } from 'express';
export default function createRouter() {
  const router = Router();
  const pages = {
    '': 'Placement home',
    students: 'Students',
    companies: 'Companies',
  };
  for (const [path, title] of Object.entries(pages)) {
    router.get(`/${path}`, (req, res) =>
      res.send(
        `<!DOCTYPE html><html lang="en"><meta charset="UTF-8"><title>${title}</title><h1>${title}</h1><nav><a href="/case/4b">Home</a> | <a href="/case/4b/students">Students</a> | <a href="/case/4b/companies">Companies</a></nav><p>A small Express website with multiple routes.</p></html>`,
      ),
    );
  }
  return router;
}
