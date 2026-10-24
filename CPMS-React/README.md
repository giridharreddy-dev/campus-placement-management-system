# CPMS React

React/Vite campus placement portal with a Node.js/Express and MySQL API.

## Browser-only sample demo

Run `npm ci`, then `npm run dev`, and open http://127.0.0.1:5173/demo. The sample demo stores data in localStorage and needs no database. This is separate from the authenticated MySQL portal at `/`.

## Authenticated portal

1. Install MySQL and run `npm ci`.
2. Copy `.env.example` to `.env`; set your own database credentials, a random JWT secret, and three distinct seed passwords of at least 12 characters.
3. Keep `DB_NAME=cpms_portfolio` and run `npm run db:demo`. This initializer refuses a database that already contains tables.
4. In separate PowerShell terminals, run `npm run server` and `npm run dev`.
5. Use the seeded student `rahul.sharma@university.edu`, recruiter `recruiter.techcorp@placement.edu`, or administrator `admin@placement.edu` with the corresponding password you configured.

Generate a signing secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

## Supporting learning material

Routes `/syllabus`, `/case-study`, and `/project-files` contain related classroom exercises and source exploration. The bundled lab snapshots are portable; builds do not read files elsewhere on your computer. Optional `npm run lab:sync` refreshes them from original lab folders if available. Teaching servers and databases have separate setup scripts. See SYLLABUS.md and case-study/OBSERVATION.md for those exercises.

## Checks

Run `npm test` and `npm run build`. MySQL integration scripts require explicit local database configuration.
