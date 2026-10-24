# How the FSD–II syllabus is used in CPMS

This guide explains each of the 25 experiment questions and the additional topics in your supplied syllabus. Each entry gives its meaning, the situation in CPMS and the source to show your lecturer.

## Start with the project flow

**CPMS means Campus Placement Management System.** Students browse roles and apply; recruiters review their company's candidates; the placement officer manages companies and applications.

For a real signed-in application:

```text
Student presses Apply in the React page
    → fetch sends POST /api/applications
    → Express checks the login, student identity and request
    → mysql2 sends a parameterized SQL query to MySQL
    → MySQL saves the application
    → Express returns JSON
    → React updates its state and displays the new application
```

| Part | Meaning | CPMS responsibility |
| --- | --- | --- |
| HTML and CSS | Page structure and presentation | Root HTML page, responsive layout, colours, cards and forms. |
| JavaScript / ES6+ | Programming language and modern syntax | Event handlers, filtering, functions, state transformations and server logic. |
| React and JSX | UI library and its HTML-like JavaScript syntax | Reusable opportunity cards, forms, calendars and role-specific pages. JSX is transformed by the build tool. |
| Node.js | Runtime that executes JavaScript outside the browser | Runs the API server and command-line setup/export tools. |
| Express.js | Web framework running inside Node.js | Matches requests to routes, runs middleware and sends responses. Node runs the program; Express organizes its HTTP behavior. |
| MySQL | Relational database server | Stores students, companies, applications and users. |
| mysql2 | Node.js package that communicates with MySQL | Creates the connection pool and runs queries from JavaScript. It is a driver, not another database. `mysql2/promise` provides its Promise interface for `await`. |
| ES modules | JavaScript module format | `import` and `export` organize files. `"type": "module"` in package.json makes `.js` files use this format in Node. CommonJS instead uses `require()` and `module.exports`. |

Sources: [WorkspacePage.jsx](workspace/WorkspacePage.jsx), [useWorkspace.js](workspace/useWorkspace.js), [server.js](backend/server.js), [db.js](backend/db.js), [package.json](package.json).

## Where the three required sets fit

1. **Basic programs:** `/syllabus?mode=basic` shows the original separate a–e programs for Experiments 1–5. Use these for the basic observation record.
2. **Combined case studies:** `/case-study` contains five manageable placement programs. Each combines its own experiment's a–e. [OBSERVATION.md](case-study/OBSERVATION.md) gives notebook-sized aims, algorithms and results.
3. **Complete project:** the main signed-in portal at `/`, plus its supporting case-study and syllabus modules. `/project-files` lets you browse all three source sets and subfolders.

The large portal extends the short programs; the short programs remain manageable to write. Some requirements, such as Hello World and demonstration subqueries, deliberately live in the classroom modules rather than being forced into every portal screen.

## Experiment 1 — Modern JavaScript and DOM

The **DOM** is the browser's object representation of HTML elements. JavaScript can select these objects and change text, styles or event behavior. The combined native program is [index.html](case-study/experiment1/index.html) with [script.js](case-study/experiment1/script.js). Open Experiment 1 on `/case-study`, or the optional native exercise in the student's Preparation view.

| Question | Concept explained | Situation and exact use in CPMS |
| --- | --- | --- |
| 1a | Linking an external JavaScript file separates behavior from HTML. | The native case-study HTML loads `script.js`. Its name/CGPA input behavior is written in that separate file. The React app also starts from the module script in [index.html](index.html). |
| 1b | Selectors find particular HTML elements. | `getElementById` selects the name input, `getElementsByClassName` finds fields, `getElementsByTagName` finds the button, `querySelector` finds the result and CGPA input, and `querySelectorAll` finds all inputs. Show all five in `script.js`. |
| 1c | An event listener runs a function when an event occurs. | The native inputs listen for `input`; editing a value changes the result message to say it is ready for another check. In the React portal, `onChange` handles search/form changes. |
| 1d | A click handler runs when a button is pressed. | The native button calls `checkEligibility`. In the portal, Apply calls the application's action; save buttons bookmark roles. See [WorkspacePage.jsx](workspace/WorkspacePage.jsx). |
| 1e | A function declaration names a reusable function; a function expression assigns one to a variable; an arrow is another function expression syntax. | `function checkEligibility()` is the declaration, `const eligible = function (...)` is the expression, and `const describeTracks = (...items) => ...` is the arrow. Together they validate input, test the classroom CGPA criterion and build the message. |

**Presentation wording:** “I first demonstrated direct DOM access in a small native JavaScript placement exercise. The main React interface uses state and JSX event handlers to update its UI.”

The native CGPA check is classroom practice. It does not block an application in the real portal. No automatic branch, year, backlog or CGPA eligibility gate was added.

## Experiment 2 — React fundamentals

React builds a page from components. The combined program is [PreparationPlanner.jsx](case-study/experiment2/PreparationPlanner.jsx), reused directly in the student's Preparation view.

| Question | Concept explained | Situation and exact use in CPMS |
| --- | --- | --- |
| 2a | A class component extends React's `Component` and changes state with `this.setState`. | `InterviewRounds` counts completed mock interview rounds. Complete a round increments it; Reset rounds sets it back to zero. This preserves the syllabus's class-component requirement within a mostly functional React project. |
| 2b | A functional component is a function returning JSX. Hooks let it retain state. | `PreparationPlanner` counts problems solved using `useState`. Solve a problem increases the count; Undo problem decreases it without going below zero. |
| 2c | JSX `onClick` connects a button to an event handler in a functional component. | Solve a problem, Undo problem and Preparation tip each call a state setter. Portal role-saving and calendar navigation also use click handlers. |
| 2d | Conditional rendering chooses which UI to show from state or props. | `showTip && <p>...</p>` shows the preparation tip only when requested. The goal message changes after three problems. [App.jsx](App.jsx) chooses login or a role's portal, while WorkspacePage shows student/staff controls conditionally. |
| 2e | String literals provide fixed text; template literals insert values into text using backticks and `${...}`. | The planner heading uses the student's name: `${name}'s placement preparation`. The workspace also builds opportunity deadlines and application progress labels this way. |

**Presentation wording:** “The preparation feature combines a class counter and a functional counter. Buttons update state, React renders the new values, and conditional messages guide the student.” These counters measure session practice, not applications stored in MySQL.

## Experiment 3 — Hooks, props, forms and data

The short combined program is [ApplicationDesk.jsx](case-study/experiment3/ApplicationDesk.jsx). It connects to the separate combined case-study API on port 5020. The larger portal uses [useWorkspace.js](workspace/useWorkspace.js), [WorkspacePage.jsx](workspace/WorkspacePage.jsx) and [Forms.jsx](workspace/Forms.jsx).

| Question | Concept explained | Situation and exact use in CPMS |
| --- | --- | --- |
| 3a | `useState` remembers a component value between renders. Its setter requests a new render. | ApplicationDesk's `saved` counter counts successful registrations during the session. WorkspacePage remembers its selected view, search text, filters and open dialog. |
| 3b | `useEffect` synchronizes with external systems after rendering; Fetch makes HTTP requests. | ApplicationDesk loads students/applications when it mounts and aborts those requests on cleanup. In the signed-in portal, useWorkspace loads companies and the current role's applications. It ignores stale responses after cleanup. Loading/error state explains failures to the user. |
| 3c | Props pass data or callbacks from a parent to a child. | ApplicationDesk passes `student` into its `StudentProfile` child. WorkspacePage passes `drive`, `model` and `onDetails` into `DriveCard`; the child displays the supplied role and invokes the parent's callback. |
| 3d | A controlled form stores field values in React state. Submit handlers validate/send those values. | ApplicationDesk controls its student/company fields and submits a registration. Login controls email/password; DriveForm controls company/role details and calls `onSave`. `preventDefault()` keeps submission within the app. |
| 3e | `map()` converts array items into repeated JSX elements. Stable keys identify individual items. | ApplicationDesk maps students into options and applications into list rows. WorkspacePage maps companies into cards and applications into pipeline items using record IDs as keys. One component renders any number of records. |

**Presentation wording:** “After loading data through Fetch, I store it in React state, pass each record into child components and render lists with map. Controlled forms collect new records.”

## Experiment 4 — Node.js and Express.js

The complete portal server is [backend/server.js](backend/server.js). The combined classroom server is [app.js](case-study/experiment4/app.js) with [server.js](case-study/experiment4/server.js). These are separate services/databases; classroom registrations are not the student's real portal records.

| Question | Concept explained | Situation and exact use in CPMS |
| --- | --- | --- |
| 4a | A route associates an HTTP method/path with a response. | The combined API's `GET /` serves HTML containing a Hello World welcome. The exact individual exercise is [learning/case/4a.mjs](learning/case/4a.mjs). The portal's `/api/health` is a separate connectivity check, not the literal Hello World requirement. |
| 4b | Multiple Express routes provide different resources/pages. | The combined server has `/`, `/students` and `/applications`. [learning/case/4b.mjs](learning/case/4b.mjs) serves linked Home, Students and Companies HTML pages for the explicit multi-page exercise. The portal separately exposes company, student and application API routes. |
| 4c | Browser console output must execute in the browser. | The combined server serves [index.html](case-study/experiment4/index.html) containing `console.log('Hello World...')`. Open that page and press F12 → Console. A console.log running in server.js prints to the terminal, which is a different output location. |
| 4d | CRUD means Create, Read, Update and Delete. Express dispatches each request to its handler. | The officer lists, adds, edits and deletes companies through GET, POST, PUT and DELETE. Application stage changes use PATCH. The short combined program demonstrates the same four CRUD operations on classroom applications. |
| 4e | A MySQL driver connects server JavaScript to the database. | [backend/db.js](backend/db.js) imports `mysql2/promise` and creates a connection pool. Express handlers await `query()`/`execute()`, then send the results as JSON. The browser does not connect directly to MySQL. |

### Where the original admin company screen is

The login button **Officer** and the workspace label **Placement officer** refer to database role **ADMIN**.

Sign in as admin at `/` and choose **Manage companies** directly in the refreshed sidebar. This table supports viewing, adding, editing and deleting companies. The previous interface is also preserved: choose **Full management tools**, or open **`http://127.0.0.1:5173/manage`**, then select **Manage Companies** in [AdminDashboard.jsx](components/AdminDashboard.jsx).

| Action to demonstrate | HTTP request | Database action |
| --- | --- | --- |
| Open company list | `GET /api/companies` | `SELECT` retrieves rows. |
| Add a company and Save Company | `POST /api/companies` | `INSERT` creates a row. |
| Edit a company and Save Changes | `PUT /api/companies/:id` | `UPDATE` changes its fields. |
| Delete and confirm | `DELETE /api/companies/:id` | `DELETE` removes the row if allowed. |
| Change an application stage | `PATCH /api/applications/:id/status` | `UPDATE` changes the status field. |

**UPDATE is an SQL command, not an HTTP method.** In this project a company PUT request leads to an SQL UPDATE; an application PATCH request also leads to an SQL UPDATE.

The refreshed Manage companies table uses the same protected company CRUD API, including deletion. `/demo` uses local sample data, so it will not show these company CRUD requests in the API Network log. Use the signed-in management page to explain the real API calls. F12 → Network shows their methods, paths, bodies and responses.

Only an authenticated admin can change companies through these endpoints. The server refuses deleting a company with active applications. Use a separate, unused company for an intentional CRUD presentation; changing live records is a real database operation.

## Experiment 5 — MySQL

MySQL stores related information in tables. The portal schema is [database/schema.sql](database/schema.sql). The short combined program is [database.sql](case-study/experiment5/database/database.sql), which uses the separate `cpms_case_study` database.

| Question | Concept explained | Situation and exact use in CPMS |
| --- | --- | --- |
| 5a | `CREATE DATABASE` creates a database; `CREATE TABLE` defines columns, types and constraints. | The portal schema defines students, companies, applications and users. The short combined SQL creates students/applications. Running SQL in MySQL Command Line Client demonstrates the required CLI workflow. |
| 5b | SQL statements define and change stored records. | `INSERT` creates a student/company/application; `UPDATE` changes a status or company details. The combined script includes CREATE, INSERT and UPDATE explicitly. Portal Express routes run these statements after authorized actions. |
| 5c | A subquery is a query nested in another query. | The combined SQL finds students above average CGPA using a scalar subquery, shortlisted students using IN, and students who have applications using correlated EXISTS. These are classroom reporting queries; the current workspace's report bars are calculated from loaded application data, not these subqueries. |
| 5d | A saved `.sql` script keeps database statements reproducible. Workbench is a graphical client for opening/executing it. | Open the combined database.sql or [learning/case/5d.sql](learning/case/5d.sql) in Workbench, save it, execute it and inspect the result grid. The combined script ends with a joined placement report. This practical workflow is performed in Workbench rather than in React. |
| 5e | A project database directory keeps initialization SQL with the codebase. | The combined program has `experiment5/database/database.sql`; the portal has `database/schema.sql`. The explicit initializer [initialize-case-study.mjs](tools/initialize-case-study.mjs) creates the separate classroom database for its API. Opening the website does not rerun this SQL. |

Important relationships: an application contains a student ID and company ID. Foreign keys link those IDs to the corresponding records. The portal's unique student/company pair prevents duplicate applications. Queries use `?` placeholders with separate values rather than concatenating submitted text into SQL.

Do not re-run initialization scripts against an existing database merely to demonstrate a screen. Use the documented classroom setup or inspect the scripts and existing result tables.

## Additional mandatory syllabus topics

These topics appear in the syllabus overview as well as the experiment questions. [ModernJavaScript.jsx](learning/ModernJavaScript.jsx) provides a small ES6 playground under `/syllabus`.

| Topic | Explanation and situation in CPMS | Source to show |
| --- | --- | --- |
| ES6 / ECMAScript | ECMAScript is the JavaScript language standard. CPMS uses ES6 features such as const/let, arrow functions, classes, destructuring and modules; async/await and optional chaining are later additions. | `package.json`, `workspace/useWorkspace.js`, `case-study/experiment2/PreparationPlanner.jsx`. |
| Arrow functions | Concise function expressions used for callbacks. They capture `this` from the surrounding scope. | Workspace `.filter()`, `.map()` and state-setter callbacks; native `describeTracks`. |
| Spread operator | Expands object properties or array elements. React uses copied containers when changing state. | `{ ...data, applications: [...] }` and `{ ...item, status }` in useWorkspace retain unchanged fields while updating the selected data. |
| Rest operator | Collects several arguments/items into one array. It uses the same `...` spelling but collects rather than expands. | Native `describeTracks(...items)` collects arguments. ModernJavaScript's `[primarySkill, ...otherSkills]` collects remaining skills. |
| Type coercion and conversion | Coercion changes a type implicitly; explicit conversion names the conversion. Form values arrive as strings. | ModernJavaScript compares `"8.2" + 1` → `"8.21"` with `Number("8.2") + 1` → `9.2`. Native code converts CGPA; useWorkspace converts openings with Number before saving. |
| Hoisting / “type hoisting” | The syllabus wording is demonstrated as declaration hoisting. Function declarations can be called before their textual position. A var binding initially reads undefined; let/const cannot be read before initialization because of the temporal dead zone. Types themselves are not hoisted. | Native code registers `checkEligibility` before its declaration. ModernJavaScript calls `greet` before its declaration and explains var/let/const. |
| String/template literals | Quoted strings give fixed text; backticks support interpolation. | Preparation heading, status messages and workspace API paths such as `/api/applications/${app.id}/status`. |
| Array/object destructuring | Extracts values into named local variables. | `const [view, setView] = useState(...)` extracts the hook's two values; function parameters such as `{ drive, model, onDetails }` extract props. Native code extracts the name input's value. |
| React components and JSX | Components encapsulate UI. JSX combines markup with JavaScript expressions. | WorkspacePage composes DriveCard, Dialog, forms and PreparationPlanner instead of repeating one large HTML page for every role. |
| Real DOM vs Virtual DOM | Native code changes real browser nodes directly. React creates in-memory UI descriptions and reconciles render results before committing needed DOM changes. | Compare native `result.textContent = ...` with the planner's state setter and JSX output. React does not mean the browser stops using the real DOM, and it is not a promise of automatic speed for every update. |
| React hooks | Hooks provide component state and effects; a custom hook packages related logic. | `useWorkspace` groups fetching, loading, mutations and local persistence. useState stores UI/data; useEffect performs requests, localStorage saving and toast-timer cleanup. |
| Node.js runtime and uses | Executes server JavaScript and supports asynchronous I/O. | Runs backend/server.js, the teaching services and submission/export tools. Express is a package inside the Node process. |
| Express routing | Method + path identify an action; middleware can run first. | `app.put('/api/companies/:id', authenticateToken, authorizeRole('ADMIN'), handler)` checks the session/role before changing a company. |
| MVC architecture | A model handles data, a controller coordinates a request, and a view displays output. | The explicit teaching example uses [models/applications.mjs](learning/server/models/applications.mjs), [controllers/applications.mjs](learning/server/controllers/applications.mjs) and the React CRUD view. The full portal separates React from Express/MySQL, but its backend routes and request logic currently share server.js; it is not a fully separated MVC backend. |
| Microservices architecture | Separately running services communicate through an API. | Teaching API port 5010 calls the advice service on 5011 over HTTP at `/case/architecture`, with timeout/failure handling. See [app.mjs](learning/server/app.mjs) and [advice-service.mjs](learning/server/advice-service.mjs). This is an educational two-process demonstration; the main portal API remains one service. |
| MySQL setup/configuration | MySQL Server must run independently; the app needs host, port, database and account settings. | [README.md](README.md) gives Windows CLI/Workbench steps. backend/env.js loads the local environment; backend/db.js passes settings to the pool. Workbench is a client, not the database server. |
| Databases, SQL queries and subqueries | Tables organize persistent relational data; queries read/change it; subqueries nest a query within another. | Portal database/schema.sql and Express queries; combined Experiment 5 and learning/case/5c.sql for explicit nested-query examples. |
| MySQL driver for Express | The driver turns a JavaScript call into database communication. A pool reuses a bounded set of connections. | `import mysql from 'mysql2/promise'`, `mysql.createPool(...)` and awaited queries in backend/db.js/server.js. Database passwords stay on the server. |

## What is real data and what is presentation data?

- **Signed-in portal:** companies, applications and their stages use the existing Express/MySQL API with authentication and role/ownership checks.
- **`/demo`:** records are samples in localStorage. Switching roles shares those local samples; Reset demo restores them.
- **Shared workspace features:** protected [backend/workspace.js](backend/workspace.js) APIs store career profiles, opportunity details, official interviews and in-app notifications in MySQL. Official bookings appear for the correct candidate/staff; personal calendar entries remain private. The workspace refreshes every 30 seconds while visible, on focus or manually.
- **Browser-local features:** bookmarks and older device-only entries remain local. New signed-in schedules and profiles use the server; demo records remain local samples.
- **Classroom modules:** use their documented practice database or in-memory sandbox. Class counters are session practice; Hello World and subqueries are explicit teaching demonstrations.

See [workspace/DEMO.md](workspace/DEMO.md) for the presentation sequence. Login passwords are not included in this source guide or submission packages.

## Changes I recommend next

The first three recommendations below are now implemented in this follow-up. The remaining items are possible next-stage work:

| Priority | Proposed change | Why it helps |
| --- | --- | --- |
| 1 — Done | Company-management table inside the refreshed admin interface with **Manage companies** navigation. | GET/POST/PUT/DELETE are easy to find and demonstrate without switching to the older screen. |
| 2 — Done | Protected shared interviews and in-app notifications in MySQL. | Official bookings appear for the correct candidate/staff across devices; personal entries remain private. Email delivery is still future work. |
| 3 — Profiles done; resumes future | Server-backed career profiles; consider resume upload/download next. | Authorized recruiters see current saved profile details. Resume storage and file validation remain future work. |
| 4 | Save application status history and use withdrawal/archive states instead of removing application records. | Preserves a reliable timeline and makes accidental changes easier to investigate or recover. |
| 5 | Add a student registration workflow, controlled recruiter onboarding and password reset. | New users could join without manually editing the database. |
| 6 | Add automated coverage for the full applicant/recruiter/officer workflow and a repeatable deployment setup. | Supports a dependable portfolio deployment after the classroom demo. |

Automatic academic eligibility checks remain excluded, as requested. See [workspace/CHANGES.md](workspace/CHANGES.md) for the completed implementation and its data-preservation checks.

## Short explanation to say during the demo

“CPMS is a campus placement system with student, recruiter and administrator roles. React builds the interface using components, props, state, hooks, forms and list rendering. JavaScript handles events and data transformations. Fetch sends requests to an Express API running on Node.js. The API checks the user's role and uses mysql2 to read or change records in MySQL. The administrator's company screen demonstrates CRUD. The project also includes five short combined case-study programs so that the native DOM, class-component, Hello World, subquery and architecture requirements are easy to show individually.”
