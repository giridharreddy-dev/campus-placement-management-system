# Mandatory syllabus coverage

Read [CONCEPT_GUIDE.md](CONCEPT_GUIDE.md) for each concept's meaning, where it is used, a situation to demonstrate and a short presentation script.

The three required sets are **25 separate basic programs**, **five combined case-study programs** (a–e together per experiment), and **one complete CPMS project containing all five experiments and subparts**. Browse their folders at `/project-files` or `submission/deliverables/README.md`. The 25 separate placement examples below are supplementary references.

The `/case-study` page offers the five combined programs. See `case-study/OBSERVATION.md` for short aims, algorithms, outputs and results, and `submission/COMBINED_CASE_STUDIES.md` for their source. Experiments 3–5 form one persistent React → Express → MySQL registration workflow. The student dashboard directly reuses the Experiment 1 checker and Experiment 2 planner.

The complete project's current frontend is [workspace/WorkspacePage.jsx](workspace/WorkspacePage.jsx), with hooks, fetch and API operations in [workspace/useWorkspace.js](workspace/useWorkspace.js). Its Preparation view reuses the exact Experiment 2 class/functional planner and the optional native Experiment 1 exercise. The earlier dashboards remain under `/manage`. The short observation programs and all mandatory syllabus topics remain available; no automatic academic eligibility gate was added. See [workspace/DEMO.md](workspace/DEMO.md) for sample-data and device-storage boundaries.

## Combined program map: every subpart

| Subparts | One combined case-study program | Connection within the complete project |
| --- | --- | --- |
| 1a, 1b, 1c, 1d, 1e | [HTML page](case-study/experiment1/index.html) + [linked JavaScript](case-study/experiment1/script.js): all five selector methods, events, click and function types | [EligibilityDesk](case-study/EligibilityDesk.jsx) embeds this exact page in [StudentDashboard](components/StudentDashboard.jsx) |
| 2a, 2b, 2c, 2d, 2e | [PreparationPlanner.jsx](case-study/experiment2/PreparationPlanner.jsx): class and functional counters, events, conditions, string literals | StudentDashboard imports the same planner |
| 3a, 3b, 3c, 3d, 3e | [ApplicationDesk.jsx](case-study/experiment3/ApplicationDesk.jsx): state counter, effect/fetch, child props, controlled form and keyed map | Uses the shared Experiment 4/5 database workflow; authenticated portal equivalents are in StudentDashboard, StudentProfile, Login and CompanyCard |
| 4a, 4b, 4c, 4d, 4e | [app.js](case-study/experiment4/app.js), [server.js](case-study/experiment4/server.js), [index.html](case-study/experiment4/index.html): Hello World, routes, browser console, CRUD, mysql2 pool | Case-study API persists registrations; [full backend](backend/server.js) extends CRUD with login, role/ownership checks and transactions |
| 5a, 5b, 5c, 5d, 5e | [database/database.sql](case-study/experiment5/database/database.sql): database/tables, insert/update, three subquery forms, Workbench script, API initialization | Supplies the combined API; [portal schema](database/schema.sql) and initializer extend it with companies/users and the full workflow |

One complete project means these modules and their running views belong to the same CPMS codebase. The classroom database is separate from portal records. For 5d, opening, saving and executing the supplied SQL in Workbench is part of the practical demonstration.

Each question has your basic program and a placement case-study program in `learning/case`. The website's Basic tabs use `Desktop/FSD/Experiment-1` (only `1a`–`1e`), `src/Experiments2`, `src/Experiments3`, `src/Experiments4` and the newly requested `src/Experiments5`. Read-only snapshots and isolated previews are under `learning/original`; refresh with `node tools/sync-original-labs.mjs` from CPMS. The older `learning/basic` files remain supplementary. Case-study HTML uses linked scripts, React uses JSX, Express uses `.mjs` routers and database examples use SQL. The website at `/syllabus` shows both versions and their source.

| Question | Required concept | CPMS case study | Complete-project connection |
| --- | --- | --- | --- |
| 1a | Link external JavaScript to HTML | External welcome script | `main.jsx`, `index.html`; Vite imports the React app |
| 1b | DOM selectors | Select opportunity elements by ID, class, tag and query selectors | `learning/case/1b` native DOM sandbox |
| 1c | Event listeners | Student name input event | `learning/case/1c`; React uses JSX event handlers in the portal |
| 1d | HTML button click | Shortlist a practice opportunity | `learning/case/1d`; `components/CompanyCard.jsx` handles real apply actions |
| 1e | Declaration, expression, arrow function | Eligibility, vacancy and greeting functions | `learning/case/1e`; expressions/arrows also appear in portal callbacks |
| 2a | Class component counter | Interview practice rounds | `case-study/experiment2/PreparationPlanner.jsx`, reused by StudentDashboard |
| 2b | Functional component counter | Practice shortlist count | `case-study/experiment2/PreparationPlanner.jsx`, reused by StudentDashboard |
| 2c | Functional button events | Placement preparation choices | `components/CompanyCard.jsx` |
| 2d | Conditional component rendering | Eligibility advice | `App.jsx` switches by login and role |
| 2e | String literals | Placement welcome message | `components/StudentDashboard.jsx` |
| 3a | useState | Practice problem count | Portal dashboards hold state with useState |
| 3b | useEffect, Fetch API | Retrieve practice opportunities from Express | `components/StudentDashboard.jsx` loads live APIs |
| 3c | Props across two components | Parent passes student profile | `StudentDashboard.jsx` → `StudentProfile.jsx` |
| 3d | React forms | Placement registration preview | `components/Login.jsx`, admin company form |
| 3e | Iterative map rendering | Opportunity list with stable keys | `components/CompanyCard.jsx` |
| 4a | Hello world in browser route | Placement server greeting | `learning/case/4a.mjs`; portal health at `/api/health` |
| 4b | Multiple Express website routes | Home, students, companies navigation | `learning/case/4b.mjs`; portal has multiple API routes |
| 4c | Browser console hello world | Express-served HTML runs console.log | `learning/case/4c.mjs` (inspect F12 Console) |
| 4d | Express CRUD | In-memory practice applications with validation | `backend/server.js`: company/application CRUD with authorization |
| 4e | Express–MySQL driver connection | Query syllabus student rows | `backend/db.js`, `backend/server.js` |
| 5a | Database/table via MySQL CLI | Separate syllabus database and students table | `database/schema.sql` |
| 5b | CREATE, INSERT, UPDATE | Students, companies, application stage update | `database/schema.sql`, portal parameterized SQL |
| 5c | Subqueries | Above-average CGPA, IN, correlated EXISTS | `learning/case/5c.sql` reporting exercise |
| 5d | Workbench script file | Joined placement report and grouped totals | `learning/case/5d.sql` |
| 5e | Database directory and initialization SQL | `learning/server/database/database.sql` | Syllabus initializer + `database/schema.sql` for the full portal |

## Additional mandatory topics in the syllabus overview

| Topic | Runnable/inspectable evidence | What to explain |
| --- | --- | --- |
| Arrow functions | 1e, `learning/ModernJavaScript.jsx` | Concise function expressions and lexical this |
| Spread operator | ModernJavaScript and 3d | Copy object/array contents; create a new state object |
| Rest operator | ModernJavaScript | Collect remaining destructured items or function arguments |
| Type coercion | ModernJavaScript live CGPA input | `"8.2" + 1` concatenates; Number conversion enables numeric addition |
| Hoisting | ModernJavaScript and 1e | Function declarations available before textual declaration; var initializes to undefined; let/const have TDZ. Types are not hoisted |
| String/template literals | 2e and ModernJavaScript | Ordinary quoted text versus backtick interpolation |
| Array/object destructuring | ModernJavaScript and 3d | Extract named object fields and positional array items |
| Components, JSX | All React examples and portal | JSX describes a component's UI; components compose larger views |
| Real DOM vs Virtual DOM | Native iframe examples vs React counters | Direct node manipulation vs React reconciliation/DOM commits; virtual DOM is an in-memory description |
| Node.js runtime and uses | `learning/server/start.mjs`, full backend | Run server JavaScript, HTTP routes and asynchronous I/O outside the browser |
| Express and routing | Experiments 4a–4e | Map HTTP methods and paths to handlers |
| MVC | `learning/server/models`, `controllers`, router examples and React views | Model holds data; controller validates and coordinates; view renders output |
| Microservices architecture | Teaching API → independent `advice-service.mjs` | HTTP communication across separately running services; 503 on unavailable service |
| MySQL installation/configuration | README Windows CLI/Workbench setup, `.env.example` | Install MySQL Server, run its Windows service, configure connection/credentials |
| Databases, queries, subqueries | 5a–5e | Relational tables, foreign keys, SQL changes and nested queries |
| MySQL driver for Express | `learning/server/database/db.mjs`, `backend/db.js` | mysql2/promise pool, async query/execute, credentials on server only |

For MySQL installation on a new Windows machine, install MySQL Server and optionally Workbench, configure a local account and port 3306, and confirm the server service is running in Windows Services. The code assumes an available MySQL Server; it does not install system software. In this workspace MySQL Server and its command line client are already available.

The term “function definition” in question 1e is demonstrated as a **function expression**, distinct from a declaration and an arrow. The overview's “type hoisting” is explained as JavaScript **declaration hoisting**; JavaScript does not hoist types.
