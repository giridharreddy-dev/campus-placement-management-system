export const combinedExperiments = [
  {
    id: 1,
    title: 'Placement eligibility desk',
    aim: 'Build one JavaScript page that checks whether a student meets a drive’s CGPA criterion.',
    scenario:
      'Before applying, a student enters their name and CGPA to check a minimum 7.0 criterion.',
    coverage: [
      '1a: linked external script',
      '1b: ID, class, tag, querySelector and querySelectorAll',
      '1c: input and click listeners',
      '1d: Check eligibility button',
      '1e: declaration, expression and arrow functions',
    ],
    steps: [
      'Link script.js from index.html and select the input/output elements.',
      'Listen for typing and the Check eligibility click.',
      'Convert the CGPA to a number and reject missing or invalid values.',
      'Call the eligibility function and display the student’s result.',
    ],
    outputs: [
      'Giri, 8.20 → meets the CGPA criterion for Software and Analytics drives.',
      'Arun, 6.50 → below the 7.0 CGPA criterion.',
      'An empty name or CGPA outside 0–10 produces a validation message.',
    ],
    result: 'The page checks a placement criterion using all five JavaScript/DOM concepts.',
    run: 'Open case-study/experiment1/index.html directly, or use the preview here.',
    connection:
      'StudentDashboard.jsx reuses this exact HTML/JavaScript checker through EligibilityDesk.jsx. The portal also displays company-specific criteria and handles authenticated applications.',
  },
  {
    id: 2,
    title: 'Personal placement preparation planner',
    aim: 'Combine class and functional React components into one student preparation feature.',
    scenario:
      'A student tracks mock interview rounds and solved problems before attending a drive.',
    coverage: [
      '2a: class component round counter',
      '2b: functional component problem counter',
      '2c: button event handlers',
      '2d: daily goal and tip conditions',
      '2e: ordinary and template string literals',
    ],
    steps: [
      'Create a class component with rounds in this.state.',
      'Create a functional parent with problems and tip visibility in useState.',
      'Handle complete, reset, solve and undo button clicks.',
      'Render the daily goal message conditionally and interpolate the student’s name.',
    ],
    outputs: [
      'Complete a round → mock interview counter becomes 1.',
      'Solve three problems → Daily practice goal reached!',
      'Undo never takes the problem count below zero; the tip button shows or hides advice.',
    ],
    result: 'A single preparation planner demonstrates the five React fundamentals.',
    run: 'Use the preview here. The same component is integrated into the signed-in student dashboard.',
    connection:
      'StudentDashboard.jsx imports this exact component. Counters track the current practice session and do not represent application totals.',
  },
  {
    id: 3,
    title: 'Placement registration desk',
    aim: 'Fetch student records, render profiles and register an application through a controlled React form.',
    scenario:
      'The placement desk selects a student, enters a company and records that student’s application.',
    coverage: [
      '3a: useState submission counter',
      '3b: useEffect with Fetch API and cleanup',
      '3c: parent-to-child StudentProfile props',
      '3d: controlled registration form',
      '3e: keyed map of profiles, options and applications',
    ],
    steps: [
      'Fetch students and applications from the Experiment 4 API when the component mounts.',
      'Pass each student to the profile child through props.',
      'Store the selected student and company in form state.',
      'POST the form, append the saved application and increment the session counter.',
    ],
    outputs: [
      'Initial profiles: Giri 8.20, Priya 7.40 and Arun 6.50.',
      'Choose Giri and enter Example Ltd → Application saved in MySQL.',
      'The new row appears in the application list and the session counter increases to 1.',
    ],
    result: 'One React workflow combines hooks, fetch, props, forms and iterative rendering.',
    run: 'Initialize Experiment 5 and start the Experiment 4 server on port 5020, then use this page.',
    connection:
      'It uses the same persistent case-study API as Experiment 4. The complete portal adds student login, ownership checks and company-specific applications.',
  },
  {
    id: 4,
    title: 'Placement application service',
    aim: 'Build one Express website/API with multiple routes, browser logging and MySQL-backed application CRUD.',
    scenario:
      'Placement staff need student records and a service to register, shortlist and remove applications.',
    coverage: [
      '4a: Hello World browser page',
      '4b: home, students and applications routes',
      '4c: console.log in the served browser page',
      '4d: GET, POST, PUT and DELETE',
      '4e: mysql2/promise pool and parameterized SQL',
    ],
    steps: [
      'Create the MySQL pool and pass it to the Express app.',
      'Serve index.html and the student/application GET routes.',
      'Validate incoming data and execute parameterized INSERT, UPDATE and DELETE queries.',
      'Return appropriate JSON and HTTP status codes.',
    ],
    outputs: [
      'Open port 5020 → Hello World! Welcome to the CPMS placement desk.',
      'F12 → Console shows Hello World from the CPMS Express website!',
      'POST returns 201; GET reads persisted rows; PUT shortlists; DELETE removes the selected case-study application.',
    ],
    result: 'One Express application covers 4a–4e and persists its data in MySQL.',
    run: 'From the repository root: node src/CPMS-React/case-study/experiment4/server.js. Standalone: npm run case:server.',
    connection:
      'The full backend applies the same HTTP/SQL pattern with authentication, role checks and stricter workflow rules.',
  },
  {
    id: 5,
    title: 'Placement database and reporting',
    aim: 'Create and initialize the placement database, update application status and run subquery reports.',
    scenario:
      'The placement officer stores student/application records and finds shortlisted and above-average candidates.',
    coverage: [
      '5a: MySQL CLI CREATE DATABASE and CREATE TABLE',
      '5b: CREATE, INSERT and UPDATE',
      '5c: scalar, IN and correlated EXISTS subqueries',
      '5d: save/open/execute one Workbench script',
      '5e: database/database.sql initializes the Express API',
    ],
    steps: [
      'Create cpms_case_study and its students/applications tables with a foreign key.',
      'Insert three students and two applications; shortlist application 101.',
      'Run the three subqueries and joined report.',
      'Use the same initialized database with the Experiment 4 server.',
    ],
    outputs: [
      'Tables: students and applications.',
      'Above-average CGPA: Giri and Priya; shortlisted: Giri; students with applications: Giri and Priya.',
      'Initial report: Giri → Software Ltd → Shortlisted; Priya → Analytics Ltd → Applied.',
    ],
    result: 'One SQL file covers all five database questions and supplies the working Express API.',
    run: 'In the MySQL client from the repository root: SOURCE src/CPMS-React/case-study/experiment5/database/database.sql; In Workbench, open, save and execute this same file.',
    connection:
      'The full portal extends this design with company records, users, ownership, unique applications and transactional operations.',
  },
];
