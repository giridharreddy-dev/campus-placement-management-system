# CPMS Angular

Standalone Angular/TypeScript frontend with a separate Node.js/Express API and MySQL database. React and Angular run independently.

## Windows setup

Install Node.js compatible with the engine range in package.json and run MySQL locally. In PowerShell, from this folder:

~~~powershell
npm ci
$env:MYSQL_SETUP_USER = 'YOUR_LOCAL_MYSQL_USER'
$env:MYSQL_SETUP_PASSWORD = 'YOUR_LOCAL_MYSQL_PASSWORD'
$env:MYSQL_SETUP_HOST = '127.0.0.1'
npm run setup
Remove-Item Env:MYSQL_SETUP_PASSWORD
~~~

Setup creates `cpms_angular_sample`, a scoped database account, sample records, and a random JWT secret in an ignored `.env`. It refuses an existing database or `.env`.

Open separate terminals for `npm run server` (API, port 5100) and `npm start` (Angular, port 4200). Or use Start Angular.cmd after setup.

## Local sample accounts

The student, recruiter, and administrator role buttons fill local demonstration credentials: `student@cpms.local`, `recruiter@cpms.local`, `admin@cpms.local`, password `CpmsDemo@2026`. These are intentionally public demo credentials, not credentials copied from the author's installation. All academic figures and people in seed records are fictional samples.

## Features

Student opportunity search, applications, status tracking, profile editing, bookmarks, interview calendars and CSV exports; recruiter candidate pipelines and official interviews; administrator company management and reports. Protected APIs enforce role, student ownership and recruiter company scope. Bookmarks remain browser-local.

## Verification

`npm run build` checks Angular templates and TypeScript. `npm run test:api` requires both local environments to be configured and a database administrator connection in sibling CPMS-React/.env. It creates and removes its own randomly named test database and checks that configured sample databases are preserved. Do not point it at production data.
