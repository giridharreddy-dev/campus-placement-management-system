# CPMS combined case studies: observation record

Five programs, each combining parts a–e of one experiment. They describe a single campus placement workflow. Use these five combined programs for your case-study observation; your original basic programs and the 25 individual concept examples remain available separately.

## Shared Windows setup

From the placement-dashboard repository root, run:

```powershell
node src/CPMS-React/tools/initialize-case-study.mjs --initialize-case-study
node src/CPMS-React/case-study/experiment4/server.js
```

The initializer creates only a new cpms_case_study database and a scoped local account. It refuses an existing database/account/configuration. Its password stays in the excluded case-study/.env. From an extracted CPMS ZIP, use npm ci, npm run db:case-study and npm run case:server instead. Configure the administrator connection in the CPMS .env first, as explained in README.md.

Open http://127.0.0.1:5173/case-study. Experiments 1 and 2 need no database. Experiments 3–5 share the separate MySQL database and port-5020 service. The signed-in student portal also uses the exact Experiment 2 preparation component.

For the manual SQL exercise, open MySQL Command Line Client from the repository root and use SOURCE src/CPMS-React/case-study/experiment5/database/database.sql; or open, save and execute that same file in Workbench. From the standalone CPMS folder use SOURCE case-study/experiment5/database/database.sql;. Re-running the script can restore its named sample records; it does not reset the full CPMS portal. Initial expected reports below assume only the supplied sample rows.

## Experiment 1: Placement eligibility desk

**Case study:** Before applying, a student enters their name and CGPA to check a minimum 7.0 criterion.

**Aim:** Build one JavaScript page that checks whether a student meets a drive’s CGPA criterion.

**Coverage:**

- 1a: linked external script
- 1b: ID, class, tag, querySelector and querySelectorAll
- 1c: input and click listeners
- 1d: Check eligibility button
- 1e: declaration, expression and arrow functions

**Algorithm:**

1. Link script.js from index.html and select the input/output elements.
2. Listen for typing and the Check eligibility click.
3. Convert the CGPA to a number and reject missing or invalid values.
4. Call the eligibility function and display the student’s result.

**Run:** Open case-study/experiment1/index.html directly, or use the preview here.

**Expected output:**

- Giri, 8.20 → meets the CGPA criterion for Software and Analytics drives.
- Arun, 6.50 → below the 7.0 CGPA criterion.
- An empty name or CGPA outside 0–10 produces a validation message.

**Actual observation:** Write your own output and attach screenshots after running this program.

**Result:** The page checks a placement criterion using all five JavaScript/DOM concepts.

**Project connection:** StudentDashboard.jsx reuses this exact HTML/JavaScript checker through EligibilityDesk.jsx. The portal also displays company-specific criteria and handles authenticated applications.

**Program files to write:** case-study/experiment1/index.html, case-study/experiment1/script.js.

## Experiment 2: Personal placement preparation planner

**Case study:** A student tracks mock interview rounds and solved problems before attending a drive.

**Aim:** Combine class and functional React components into one student preparation feature.

**Coverage:**

- 2a: class component round counter
- 2b: functional component problem counter
- 2c: button event handlers
- 2d: daily goal and tip conditions
- 2e: ordinary and template string literals

**Algorithm:**

1. Create a class component with rounds in this.state.
2. Create a functional parent with problems and tip visibility in useState.
3. Handle complete, reset, solve and undo button clicks.
4. Render the daily goal message conditionally and interpolate the student’s name.

**Run:** Use the preview here. The same component is integrated into the signed-in student dashboard.

**Expected output:**

- Complete a round → mock interview counter becomes 1.
- Solve three problems → Daily practice goal reached!
- Undo never takes the problem count below zero; the tip button shows or hides advice.

**Actual observation:** Write your own output and attach screenshots after running this program.

**Result:** A single preparation planner demonstrates the five React fundamentals.

**Project connection:** StudentDashboard.jsx imports this exact component. Counters track the current practice session and do not represent application totals.

**Program files to write:** case-study/experiment2/PreparationPlanner.jsx.

## Experiment 3: Placement registration desk

**Case study:** The placement desk selects a student, enters a company and records that student’s application.

**Aim:** Fetch student records, render profiles and register an application through a controlled React form.

**Coverage:**

- 3a: useState submission counter
- 3b: useEffect with Fetch API and cleanup
- 3c: parent-to-child StudentProfile props
- 3d: controlled registration form
- 3e: keyed map of profiles, options and applications

**Algorithm:**

1. Fetch students and applications from the Experiment 4 API when the component mounts.
2. Pass each student to the profile child through props.
3. Store the selected student and company in form state.
4. POST the form, append the saved application and increment the session counter.

**Run:** Initialize Experiment 5 and start the Experiment 4 server on port 5020, then use this page.

**Expected output:**

- Initial profiles: Giri 8.20, Priya 7.40 and Arun 6.50.
- Choose Giri and enter Example Ltd → Application saved in MySQL.
- The new row appears in the application list and the session counter increases to 1.

**Actual observation:** Write your own output and attach screenshots after running this program.

**Result:** One React workflow combines hooks, fetch, props, forms and iterative rendering.

**Project connection:** It uses the same persistent case-study API as Experiment 4. The complete portal adds student login, ownership checks and company-specific applications.

**Program files to write:** case-study/experiment3/ApplicationDesk.jsx.

## Experiment 4: Placement application service

**Case study:** Placement staff need student records and a service to register, shortlist and remove applications.

**Aim:** Build one Express website/API with multiple routes, browser logging and MySQL-backed application CRUD.

**Coverage:**

- 4a: Hello World browser page
- 4b: home, students and applications routes
- 4c: console.log in the served browser page
- 4d: GET, POST, PUT and DELETE
- 4e: mysql2/promise pool and parameterized SQL

**Algorithm:**

1. Create the MySQL pool and pass it to the Express app.
2. Serve index.html and the student/application GET routes.
3. Validate incoming data and execute parameterized INSERT, UPDATE and DELETE queries.
4. Return appropriate JSON and HTTP status codes.

**Run:** From the repository root: node src/CPMS-React/case-study/experiment4/server.js. Standalone: npm run case:server.

**Expected output:**

- Open port 5020 → Hello World! Welcome to the CPMS placement desk.
- F12 → Console shows Hello World from the CPMS Express website!
- POST returns 201; GET reads persisted rows; PUT shortlists; DELETE removes the selected case-study application.

**Actual observation:** Write your own output and attach screenshots after running this program.

**Result:** One Express application covers 4a–4e and persists its data in MySQL.

**Project connection:** The full backend applies the same HTTP/SQL pattern with authentication, role checks and stricter workflow rules.

**Program files to write:** case-study/experiment4/app.js, case-study/experiment4/server.js, case-study/experiment4/index.html.

## Experiment 5: Placement database and reporting

**Case study:** The placement officer stores student/application records and finds shortlisted and above-average candidates.

**Aim:** Create and initialize the placement database, update application status and run subquery reports.

**Coverage:**

- 5a: MySQL CLI CREATE DATABASE and CREATE TABLE
- 5b: CREATE, INSERT and UPDATE
- 5c: scalar, IN and correlated EXISTS subqueries
- 5d: save/open/execute one Workbench script
- 5e: database/database.sql initializes the Express API

**Algorithm:**

1. Create cpms_case_study and its students/applications tables with a foreign key.
2. Insert three students and two applications; shortlist application 101.
3. Run the three subqueries and joined report.
4. Use the same initialized database with the Experiment 4 server.

**Run:** In the MySQL client from the repository root: SOURCE src/CPMS-React/case-study/experiment5/database/database.sql; In Workbench, open, save and execute this same file.

**Expected output:**

- Tables: students and applications.
- Above-average CGPA: Giri and Priya; shortlisted: Giri; students with applications: Giri and Priya.
- Initial report: Giri → Software Ltd → Shortlisted; Priya → Analytics Ltd → Applied.

**Actual observation:** Write your own output and attach screenshots after running this program.

**Result:** One SQL file covers all five database questions and supplies the working Express API.

**Project connection:** The full portal extends this design with company records, users, ownership, unique applications and transactional operations.

**Program files to write:** case-study/experiment5/database/database.sql.


## Other mandatory topics and portfolio features

- Experiment 1: spread/rest for role labels, array/object destructuring, Number conversion/type coercion, template literals and a function declaration referenced before its definition (hoisting).
- Experiments 2–3: JSX, component composition and state updates. React reconciles render output and updates the real DOM; Experiment 1 changes native DOM nodes directly.
- Node.js is the server runtime; Express supplies HTTP routing; mysql2 connects the backend to MySQL. Import/export follows ES modules with type: module.
- MVC: learning/server/controllers and models demonstrate separation; do not describe the short combined Express app as a full MVC refactor.
- Microservices: learning/server/advice-service.mjs is a separate process called by the teaching API. Start both services and use http://127.0.0.1:5010/case/architecture.
- MySQL configuration: Windows service, port, CLI/Workbench and environment setup are explained in README.md and case-study/.env.example.
- The complete portal goes further: three roles, hashed passwords, cookie sessions, backend ownership checks, company CRUD, application progression, dashboard totals and transactions.

The observation contains the case-study programs above. Automated verification files under tests/ are separate and do not belong in your observation.
