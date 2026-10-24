# Campus Placement Management System (CPMS)

A student portfolio project for managing campus placement opportunities, applications, candidate selection and interviews. It includes independently runnable React and Angular frontends with Node.js/Express APIs and MySQL persistence.

## Implementations

| Version | Stack | Frontend | API |
| --- | --- | --- | --- |
| [React](CPMS-React/README.md) | React, JavaScript, Vite | 5173 | 5000 |
| [Angular](CPMS-Angular/README.md) | Angular, TypeScript, reactive forms, signals | 4200 | 5100 |

## Placement workflows

- Students can search opportunities, apply, track selection stages, manage career profiles and view interview schedules.
- Recruiters can review candidates for their company, update the selection pipeline and schedule official interviews.
- Administrators can manage companies and inspect campus placement activity.
- The workspace includes notifications, CSV exports and calendar downloads.
- Authentication uses bcrypt password hashes, JWTs and HttpOnly cookies. APIs enforce roles, student ownership and recruiter company scope.

## Fastest way to explore

Install dependencies in CPMS-React, start Vite and open its browser-only sample workspace:

~~~powershell
cd CPMS-React
npm ci
npm run dev
~~~

Open **http://127.0.0.1:5173/demo**. This uses localStorage sample data, does not send real applications, and needs no MySQL. The authenticated portal at `/` uses the API and database instead. See each implementation's README for database setup and role accounts.

## Architecture

~~~text
React or Angular UI -> Express API -> MySQL
                           |
                     Role authorization
                     JWT session cookies

React /demo -> localStorage sample data
~~~

React and Angular have separate runtime configuration, databases and session cookies. The backend is an Express application; supporting classroom services illustrate additional concepts.

## Project scope

This is a local academic/portfolio demonstration, not a deployed production placement service. Academic figures, candidates, companies and seed accounts are sample data. Automatic academic eligibility enforcement is not implemented. No real email or application is sent outside the local portal. AI/ML is not a feature of this project.

## Repository contents

- CPMS-React/: portal, sample workspace, supporting FSD learning exercises, schema and tests.
- CPMS-Angular/: separate Angular implementation, API, schema and setup scripts.
- SECURITY.md: configuration and publication notes.

No personal environment files, database dumps, dependencies, build folders, submission documents, screenshots of account data, or previous Git history are included. The export replaces the local admission number with SAMPLE001 and retains separate versions without modifying the original projects.
