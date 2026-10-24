# CPMS: API connections, database relationships and interview preparation

This guide describes the current local Desktop project. It covers both the full CPMS portal and the short combined case-study programs. Interview scheduling is a portal feature; the short case study demonstrates application registration and CRUD.

## 1. Start with this explanation

> CPMS is a campus placement management system. Students browse opportunities, submit applications, maintain career profiles and view interviews. Recruiters manage candidates for their assigned company, and administrators manage companies and the placement process. I used React for the interface, Express running on Node.js for the API, and MySQL for persistent data. The browser calls the API using fetch; the server checks the request and uses mysql2 to execute SQL.

For the smaller case study:

> I simplified CPMS into a placement registration desk. Experiment 2 demonstrates React components and events. Experiment 3 provides a React registration form. Experiment 4 provides an Express API and an HTML administration screen. Experiment 5 supplies the MySQL tables and queries. Experiments 3, 4 and 5 work together to save and display student applications.

## 2. What each technology does

| Technology | Meaning | Its job here |
| --- | --- | --- |
| HTML and CSS | Page structure and presentation | Forms, labels, layouts, cards and responsive styling |
| JavaScript | Programming language | Event handlers, validation, requests and server logic |
| React | UI library | Components, forms, state and rendering |
| JSX | JavaScript syntax extension for describing UI | Component markup transformed by Vite's React tooling |
| Vite | Frontend development/build tool | Runs the development site and builds frontend assets |
| Node.js | JavaScript runtime outside the browser | Executes the Express backend and tools |
| Express.js | Web framework running inside Node.js | Routes HTTP requests and runs middleware |
| MySQL | Relational database server | Stores tables and enforces keys and constraints |
| mysql2/promise | Node.js MySQL driver with Promise support | Lets server JavaScript connect to MySQL and await queries |
| dotenv | Environment configuration loader | Loads server settings from .env into process.env |

Node.js runs the server program. Express supplies convenient routing and request/response handling within that program. mysql2 is the connector; MySQL is the database it connects to.

The import style is **ES modules (ESM)**. `"type": "module"` in package.json makes Node treat that package's .js files as ES modules. CommonJS normally uses require() and module.exports.

```js
import express from 'express';
const app = express();
const PORT = process.env.PORT || 5000;
```

`express` is imported from a package. `PORT` is a local constant; writing `import PORT` would require another module to export it. `const` works in both ESM and CommonJS.

## 3. The two connection flows

Full portal during development:

```text
React browser UI :5173
  -> fetch('/api/...')
  -> Vite development proxy
  -> Express API running on Node.js :5000
  -> mysql2/promise connection pool
  -> MySQL :3306, database cpms
  -> SQL result -> JSON response -> React state -> updated UI
```

Combined case study:

```text
Experiment 3 React UI :5173
  -> fetch('http://127.0.0.1:5020/applications')
  -> Experiment 4 Express router -> controller -> model
  -> mysql2/promise pool -> MySQL :3306, database cpms_case_study
  -> joined application row -> JSON -> React state -> rendered list
```

The Experiment 4 HTML admin page is served by the same API at http://127.0.0.1:5020/. Its browser JavaScript also uses fetch for CRUD. Experiment 5's separate 5e read-only server runs on port 5025 against the same case-study database.

The portal browser uses relative `/api` URLs. Vite forwards them during development. A deployed site needs its own API routing configuration; Vite's development proxy does not deploy itself.

The case-study React page contacts port 5020 directly, which is a different origin from port 5173. Its API sets CORS response headers for the supported local frontend origins. CORS controls whether browser JavaScript may read cross-origin responses; it does not replace authentication.

### How the database connection is configured

The browser never connects directly to MySQL. The backend reads its .env and creates a reusable pool with mysql.createPool(). The portal allows up to 10 pooled connections; the new Experiment 4 case study allows 3.

| Setting | Full CPMS | Combined case study |
| --- | --- | --- |
| Environment file | src/CPMS-React/.env (preferred by backend/env.js) | src/Experiments4CaseStudy/.env |
| Variables | DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | CASE_DB_HOST, CASE_DB_PORT, CASE_DB_USER, CASE_DB_PASSWORD |
| Database | cpms in this local setup | cpms_case_study, fixed in db.js |
| MySQL port | 3306 | 3306 |
| Local demo credentials | root / root | root / root |

The portal environment loader falls back to the outer project's .env if a CPMS-local file is absent. The new case-study loader falls back to CPMS/case-study/.env. These are local demo credentials; a future hosted installation should use its own database account and secret configuration.

`await pool.execute(sql, values)` runs parameterized SQL. A SELECT returns `[rows, fields]`; an INSERT result includes insertId. The pool reuses connections. Transaction code borrows one connection, commits or rolls back, and releases it in finally.

## 4. A real request: submitting an application

### Full CPMS

1. A signed-in student clicks Apply on an opportunity.
2. React sends POST /api/applications with a JSON body containing companyId.
3. express.json() parses the body. Authentication verifies the JWT; authorization requires STUDENT.
4. The server takes student_id from the verified account. It rejects an attempt to submit for another student.
5. Inside a transaction, it inserts an Applied application and creates notifications for the related accounts.
6. MySQL checks the student/company foreign keys and the unique student/company pair.
7. The server returns HTTP 201 with the new ID. React reloads server data and updates the displayed application list.

A duplicate application returns 409. An invalid referenced student/company returns 400. Academic eligibility filtering by CGPA, branch, year and backlogs has not been added, as requested.

### Combined case study

1. Experiment 3 holds studentId and company in controlled React form state.
2. onSubmit calls preventDefault(), preventing a normal page reload.
3. fetch sends POST /applications with Content-Type: application/json.
4. The Experiment 4 controller validates the student ID and trimmed company name.
5. The model executes INSERT INTO applications (student_id, company) VALUES (?, ?).
6. It SELECTs the saved application joined to students, then returns it with HTTP 201.
7. React adds the returned row to state and increments the current-session submission counter.

The saved database row persists after refresh. The current-session counter starts again when that component remounts. This teaching API has no login or role enforcement and does not have the portal's unique student/company constraint.

## 5. API means a method plus a path

An API is an agreed way for programs to communicate. An endpoint is a particular method/path combination. GET /applications and POST /applications share a path but perform different operations.

| Method | Purpose | SQL usually involved |
| --- | --- | --- |
| GET | Read records | SELECT |
| POST | Create a resource | INSERT |
| PUT | Supply an update/replacement representation | UPDATE |
| PATCH | Change selected fields | UPDATE |
| DELETE | Remove a resource | DELETE |

**UPDATE is an SQL command, not an HTTP method.** PUT and PATCH can both result in SQL UPDATE. The short teaching API uses PUT to update just application status; that is its existing contract, although PATCH would express a partial update more precisely.

Important full-portal endpoints:

| Endpoint | Situation |
| --- | --- |
| POST /api/auth/login | Verify email/password and issue login token |
| GET /api/auth/me | Read the authenticated identity from the verified token |
| POST /api/auth/logout | Clear the browser login cookie |
| GET /api/companies | Load opportunities; currently public |
| POST /api/companies | Admin creates a company/opportunity |
| PUT /api/companies/:id | Admin edits a company/opportunity |
| DELETE /api/companies/:id | Admin deletes a company only after the active-application checks |
| POST /api/applications | Student submits an application |
| GET /api/students/:id/applications/details | Student's detailed applications, subject to access checks |
| GET /api/recruiter/applications | Recruiter's candidate list; recruiters are scoped to their company |
| GET /api/applications | Staff application list; recruiter results are company-scoped |
| PATCH /api/applications/:id/status | Recruiter/admin changes application stage |
| DELETE /api/applications/:id | Student owner/admin withdraws by deleting the record |
| GET /api/workspace | Load permitted interviews, notifications, profiles and company details |
| PUT /api/workspace/profile | Student saves career profile |
| POST /api/workspace/interviews | Create an official interview or personal schedule entry |
| DELETE /api/workspace/interviews/:id | Cancel an entry after permission checks |
| PATCH /api/workspace/notifications/read | Mark the current user's notifications as read |

Important short-case-study endpoints on port 5020:

| Endpoint | Situation |
| --- | --- |
| GET /students | Populate the student selector |
| GET /applications | Display joined student/application rows |
| POST /applications | Register an application |
| PUT /applications/:id | Set Applied or Shortlisted status |
| DELETE /applications/:id | Delete the selected application |

`:id` is a route parameter, for example /applications/101. `req.params.id` reads it. `req.body` contains parsed JSON. `res.status(201).json(...)` sends the HTTP status and JSON response.

Remember these response codes: 200 success; 201 created; 400 invalid input; 401 missing/invalid login; 403 insufficient permission; 404 missing resource; 409 conflict such as a duplicate; 500 unexpected server failure; 503 unavailable dependency in the teaching/workspace error handlers.

## 6. Database schema: what connects to what?

A schema describes tables, columns, types, keys and constraints. It is different from an API route: the API exposes operations, while the schema organizes stored data.

Full CPMS uses **8 tables**:

| Table | Purpose | Relationship |
| --- | --- | --- |
| students | Student academic/contact record | One student can have many applications |
| companies | Company/opportunity record | One company can receive many applications |
| applications | Student's application to a company, including its stage | Foreign keys to students and companies |
| users | Login identity, password hash and role | Optional link to a student or a company |
| career_profiles | Headline, GitHub and LinkedIn | At most one per student; student_id is both primary and foreign key |
| company_details | Work mode, deadline, tags and description | At most one per company; company_id is both primary and foreign key |
| interviews | Round, time, venue, duration, kind and creator | Each belongs to one application and one creator user |
| workspace_notifications | Per-account in-app messages/read state | Each belongs to one user |

```text
students  1 ---- many applications many ---- 1 companies
students  1 ---- 0..1 career_profiles
companies 1 ---- 0..1 company_details
applications 1 ---- many interviews
users        1 ---- many interviews (created_by)
users        1 ---- many workspace_notifications
```

Students and companies therefore have a **many-to-many relationship through applications**. Each application stores one particular student's stage for one particular company.

users.student_id links student logins and users.company_id links recruiters to their company; administrators normally have neither. The schema permits multiple users to reference the same student/company, so it does not enforce one login per student. The application treats one companies row as an opportunity with one position; a separate jobs table would be a useful future refinement.

The notification application_id is a logical reference, **not a declared foreign key**. Its user_id is a foreign key. This distinction matters when describing what MySQL actually enforces.

Short case study uses **2 tables**: students and applications. applications.student_id references students.id, giving one student many applications. Company is plain text in applications; there is no companies table, login table or interview table in that database.

### Keys, constraints and deletion

- Primary key: uniquely identifies a row, such as applications.id.
- Foreign key: requires a valid referenced row, such as interviews.application_id.
- UNIQUE(student_id, company_id): prevents the same student applying twice to the same portal opportunity, including simultaneous requests.
- NOT NULL: requires a value. CHECK in the small case study restricts CGPA to 0–10 and status to Applied/Shortlisted.
- ON DELETE CASCADE: removes dependent rows. Deleting a portal application removes its linked interviews.
- ON DELETE RESTRICT: prevents deletion while referenced. A portal company with applications cannot simply be removed.
- ON DELETE SET NULL: clears a user account's student/company link if that referenced row is removed; it does not delete the user.

The short case-study student foreign key uses the default restrictive behavior. Do not assume every relationship cascades.

The portal's company-deletion handler adds its own policy: it blocks companies with active applications, but can delete Rejected applications in a transaction before removing their company. ON DELETE RESTRICT prevents an unhandled referenced company deletion; it is not an archive policy that preserves every application forever.

Example portal report:

```sql
SELECT s.name, c.name AS company, a.status
FROM applications a
JOIN students s ON s.id = a.student_id
JOIN companies c ON c.id = a.company_id;
```

JOIN combines related rows. LEFT JOIN can also retain a student/company without an optional profile/detail row. The schema separates reusable student and company data from individual applications, reducing duplication; it still has simple demo choices such as comma-separated student skills.

## 7. Interview scheduling, step by step

1. Open the signed-in workspace's interview schedule and choose an application.
2. The React form holds applicationId, title, date/time, venue and duration in state.
3. The browser's datetime-local input represents local time. useWorkspace converts it with new Date(values.at).toISOString(), producing a UTC string ending in Z.
4. React sends POST /api/workspace/interviews. The session cookie accompanies the request.
5. Express verifies login and role/account links. It validates the application ID, required title/venue, supported duration and a future UTC date/time.
6. A transaction SELECTs the application FOR UPDATE. This locks that row for the transaction. Missing applications return 404; another student's or company's application returns 403. Rejected/Withdrawn applications are blocked with 409.
7. The server chooses kind from the authenticated role: STUDENT produces personal; RECRUITER or ADMIN produces official. The client cannot choose to become staff by sending a different kind.
8. It inserts into interviews and creates notifications in that same transaction. If either operation fails, rollback prevents a partial save.
9. It returns 201 with the interview ID. React refreshes the workspace, showing the saved entry.
10. Other signed-in views refresh when focused, through Refresh workspace, or every 30 seconds while visible. This is polling, not WebSocket push.

The scheduling route checks application status but **does not automatically change it to Interview**. Staff advance the application separately through the status API. Its explicit scheduling guard blocks Rejected/Withdrawn; it does not require the application to have already reached the Interview stage.

### Who can see and cancel an entry?

| Entry | Visible to | Cancellation |
| --- | --- | --- |
| Official | Related student, recruiters for that company, administrators | Assigned company's recruiter or administrator |
| Personal | Its creator only, within their permitted application scope | Its creator only |

Official notifications go to related student accounts, the company's recruiters and administrators. Personal-entry notifications go only to the creator. These are in-app records; the project does not send email or SMS.

UTC example: 15 October 2026 at 10:00 in India is 2026-10-15T04:30:00.000Z. MySQL's scheduled_at is DATETIME with the application's UTC convention; DATETIME itself does not carry timezone information. The API returns a UTC timestamp and the browser displays local time.

The calendar download creates an .ics file with start/end times. It can be imported into a calendar application; this is not automatic Google Calendar/Outlook synchronization.

Cancellation uses DELETE /api/workspace/interviews/:id with ownership/role checks. Official cancellation also creates notifications in a transaction. Application withdrawal deletes the application, and the foreign key cascade removes its interviews.

Current limits: no check for overlapping interviews, no automatic rescheduling endpoint, no email/SMS delivery and no push notification connection. These are reasonable improvements to discuss rather than claim as existing features. The smaller case study has no interview-scheduling module.

## 8. Authentication, authorization and safe queries

Authentication asks **who are you?** Login looks up the user, uses bcrypt.compare() to check the password against password_hash, then signs a JWT with a 24-hour expiry. The browser receives an HttpOnly cookie. JavaScript cannot read an HttpOnly cookie directly, but the browser can send it with requests. The login response also returns a token, and middleware supports Authorization: Bearer tokens.

Authorization asks **are you allowed to do this?** Middleware checks role, and handlers check student ownership or recruiter company assignment. Hiding an admin button is a UI choice; it is the backend check that protects the operation.

JWT is signed data, not encrypted secret storage. The JWT secret and database password belong on the server. A password hash is not reversible password encryption. Logout clears the browser cookie; the current implementation does not maintain a JWT revocation list, so an already copied token remains valid until expiry.

Parameterized SQL separates input values from SQL syntax:

```js
await db.execute(
  'UPDATE applications SET status = ? WHERE id = ?',
  [status, id],
);
```

The placeholders protect these values against SQL injection. They do not remove the need for input validation or permission checks. SQL identifiers such as table names are not ordinary value placeholders.

## 9. MVC and additional interview concepts

In the new Experiment 4 folder:

```text
routes/applications.js -> controllers/applications.js -> models/applications.js
       choose handler         validate/coordinate           execute SQL
```

The View is the rendered React page or Express-served HTML page. The Controller handles the operation and response. The Model handles data access. This is MVC-style separation. The full portal currently keeps much of its logic in backend/server.js and backend/workspace.js; do not describe it as having the exact same separate model/controller folder structure.

| Interview question | Answer using this project |
| --- | --- |
| What is state? | Component-owned changing data. I use useState for form fields, loaded records and saving messages; setters trigger rendering. |
| What are props? | Parent-supplied inputs. ApplicationDesk passes student to StudentProfile; the child displays it. |
| Why controlled forms? | React state supplies value and onChange updates it, making validation and submission consistent. |
| Why useEffect? | Synchronize with an external system. The case study fetches initial records after mounting and aborts its requests during cleanup. |
| What does [] mean? | The effect has no reactive dependencies. Development Strict Mode may run an extra setup/cleanup cycle; do not promise literally one request in every environment. |
| Why map and keys? | map renders rows from arrays; stable IDs help React match list items across changes. |
| Why functional state updates? | setSaved(count => count + 1) uses the previous value safely when updates are queued. |
| Why spread/destructuring? | {...form, company: value} makes a new object; const { companyId } = req.body extracts a field. |
| Spread versus rest? | Spread expands items/properties; rest collects remaining values. authorizeRole(...allowedRoles) uses rest parameters. |
| Why Number()? | Form values often arrive as strings. Explicit conversion allows numeric validation instead of accidental concatenation. |
| Declaration versus expression versus arrow? | function load() is a declaration; const load = function() {} is an expression; const load = () => {} is an arrow. Arrows capture lexical this. |
| What is hoisting? | Declarations are handled before execution; function declarations are callable earlier, var initially reads undefined, and let/const cannot be accessed before initialization. |
| String versus template literal? | 'Applied' is a quoted string literal; a backtick string can interpolate ${value}. |
| Class versus function component? | The preparation planner demonstrates a class with this.state/setState and a function component with hooks. Hooks are used in function components. |
| DOM versus virtual DOM? | Native exercises select and change actual DOM nodes. React calculates UI descriptions and reconciles changes before updating the DOM. |
| Event handler versus listener? | Native exercises use addEventListener; React components express interactions with onClick/onSubmit/onChange. |
| Promise and async/await? | A Promise represents an asynchronous result. await pauses that async function until the result arrives; it does not block the whole Node process. |
| Why Promise.all? | The registration desk loads students and applications concurrently because neither request needs the other's result. |
| Does fetch reject on 404? | Normally no. The code must check response.ok and handle an unsuccessful HTTP response. |
| What is middleware? | A function in the request chain. express.json parses JSON; authentication checks a token; authorization checks permitted roles. |
| Pool versus single connection? | A pool reuses a bounded set of connections for concurrent requests. One transaction must stay on its borrowed connection. |
| What is a transaction? | Operations commit together or roll back together. Interview insertion and notification insertion use one transaction. |
| What does FOR UPDATE do? | It locks selected application/interview rows during a transaction to coordinate competing writes. It does not check calendar overlaps. |
| How are simultaneous status edits handled? | The update includes the previously read status in WHERE. If it changed meanwhile, the handler returns 409 instead of silently overwriting it. |
| Why an index? | It helps matching/filtering/order operations. interviews has an index on scheduled_at; notifications has an index on user_id and created_at. |
| JOIN versus subquery? | JOIN combines related rows; a subquery provides a nested result or condition. Experiment 5 demonstrates scalar AVG, IN and correlated EXISTS queries. |
| CLI versus Workbench? | They are different clients for the same MySQL server. SQL scripts can be run in either; Workbench adds an editor and result grid. |
| Is CPMS microservices? | The main portal is a modular backend application. A separate teaching advice service demonstrates HTTP communication between services; that does not make the entire portal a microservices system. |
| Is the demo saved in MySQL? | /demo uses browser localStorage. Signed-in applications, profiles and new interviews use the API/MySQL. Bookmarks and some device-specific data remain local. |

Recruiter progression is Applied -> Shortlisted -> Interview -> Selected -> Offered, with rejection allowed from those stages. Recruiters cannot reopen Rejected applications. Administrators can override stages, including reopening Rejected, but cannot set the status back to Applied. Scheduling and application progression are separate operations.

## 10. Questions about design and future work

**Why separate the case-study database?** So classroom CRUD and repeated SQL exercises do not change live placement records. The full portal uses cpms; the short program uses cpms_case_study.

**Why not put everything into one table?** A student can apply to several companies. Separate student/company records avoid repeating their full details per application and allow application-specific status and interviews.

**What would you improve next?** Add overlap checks and a rescheduling operation; move bookmarks to account storage; separate companies from job openings; add pagination and server-side search; then add email delivery with retries, audit history and deployment monitoring. For deployment, review secrets, database permissions, cookie/HTTPS settings and API hosting configuration. These are proposals, not completed features.

**What is your strongest implementation example?** Explain one operation end to end: interview form -> UTC JSON request -> login/ownership validation -> transaction -> interview and notifications -> response -> workspace reload. Then explain how the simpler registration case study teaches the same layers.

## 11. What to show during an interview or viva

1. Show the smaller Experiment 3 registration form. Point to useState, useEffect, props, form submission and map in Combined.jsx.
2. Open the browser Network panel and explain an existing GET /students response. POST/PUT/DELETE demonstrations change practice data, so use only disposable case-study records when demonstrating them.
3. Open the Experiment 4 router, controller and model. Follow one route to its parameterized SQL.
4. Show the two-table case-study schema, then the eight-table portal schema and the applications relationship.
5. In the full portal, explain the different student/recruiter/admin permissions and inspect the interview form. An actual schedule/cancellation demo should use an intentionally disposable record.
6. Explain /demo as a browser-local presentation mode. Use the signed-in portal when demonstrating server persistence and authorization.

Do not memorize every file. Be able to trace one successful request, one rejected request and one database relationship.

## 12. Code to keep open

- [Portal request/state hook](workspace/useWorkspace.js)
- [Interview and profile forms](workspace/Forms.jsx)
- [Login context](context/AuthContext.jsx)
- [Portal core routes and application progression](backend/server.js)
- [Interview routes, transactions and notifications](backend/workspace.js)
- [Authentication/role middleware](backend/middleware/auth.js)
- [Portal MySQL pool](backend/db.js)
- [Four core tables](database/schema.sql) and [four workspace tables](database/workspace.sql)
- [Calendar file export](workspace/downloads.js)
- [Experiment 3 combined React program](../Experiments3CaseStudy/Combined.jsx)
- [Experiment 4 routes](../Experiments4CaseStudy/routes/applications.js), [controller](../Experiments4CaseStudy/controllers/applications.js), [model](../Experiments4CaseStudy/models/applications.js) and [pool](../Experiments4CaseStudy/db.js)
- [Experiment 5 combined SQL](../Experiments5CaseStudy/Combined.sql)
- [Detailed syllabus map](SYLLABUS.md) and [existing concept guide](CONCEPT_GUIDE.md)

This is a code-based explanation, not a claim that every feature is ready for public production. No application records were changed to prepare this guide.
