# Classroom demonstration

For the portfolio website demo, start at **`/demo`** and follow [workspace/DEMO.md](workspace/DEMO.md). Present the same sample application through Student → Placement officer → Student, then show the calendar, recruiter board and report download. Demo samples persist in this browser and can be reset. Sign in at `/` to show the protected MySQL-backed portal; `/manage` preserves the existing management tools.

For the combined case-study presentation, start at `/case-study`: demonstrate eligibility in Experiment 1, preparation counters in 2, registration in 3, the same saved application through GET/PUT/DELETE in 4, and the initialization/subquery report in 5. Follow `case-study/OBSERVATION.md` to write five observations. The walkthrough below covers the existing individual examples and complete portal.

1. Open your original basic-program Word record. The website's Basic program tab and BASIC_PROGRAMS.md now match your existing files. For the new Experiment 5, use src/Experiments5/README.md to write your observation. Existing original files are unchanged.
2. Start the frontend and teaching server, then open `/syllabus`. Choose 1b, compare **Basic program** and **CPMS case study**, and expand the source. Explain the selectors and their visible output.
3. Show 1c's input listener, 1d's click, and 1e's three function types. The source has an actual external HTML script link even though the lab embeds it for convenient viewing.
4. Show 2a class state versus 2b functional state. Both counters represent practice activity; real application totals come from the backend. Show conditional rendering in 2d and the string/template literals in 2e.
5. In case-study 3b, show the Network tab request to port 5010, then the useEffect cleanup and AbortController. Your basic 3b instead calls JSONPlaceholder over the internet. Show props in 3c, a valid registration preview in 3d, and stable list keys in 3e; your original basic 3e displays six companies.
6. Scroll to the ES6 playground. Enter CGPA 8.2: string + 1 gives 8.21; numeric conversion + 1 gives 9.2. Explain rest/spread, destructuring, hoisting, var, let and const.
7. Open 4a's server greeting, navigate all three pages in 4b, and press F12 on 4c to show **the browser console**. Server terminal logging is a different thing.
8. Open 4d and use Load → Create → Shortlist → Delete. Explain GET, POST, PUT, DELETE and HTTP status codes. The model is isolated in memory and resets when the teaching server restarts. The production portal's real workflow has stricter role/state checks.
9. Run the syllabus database initializer. Show the 4e JSON route querying MySQL; show 5a/5b tables and changes, 5c's scalar/IN/EXISTS results, and 5d in Workbench. Point to the database directory for 5e.
10. Start the advice service and open `/case/architecture` on port 5010. Stop the service and show the 503 result. Explain two processes communicating over HTTP and the difference from a single Express application.
11. Open `/` and log in as a student. Show live profile, available companies and application status. Apply or withdraw only if you intend to change your existing data. Use a new `cpms_portfolio` database if you want a disposable presentation.
12. Log in as the appropriate recruiter/admin to show scoped candidate management and company administration. Explain that backend authorization is enforced independently of UI visibility.
13. Show the complete-source record and ZIP, then explain that Stage 2 will cover production deployment and operational hardening.

## Questions to be ready for

- Why is MySQL access on the server? Database credentials must not be in client code, and authorization must run at the server boundary.
- Why is an application counter not used as the real application total? Real totals come from persisted rows; a practice counter only demonstrates state updates.
- Why keep native DOM examples in an iframe? React owns its rendered nodes. A sandboxed iframe lets the native example operate on its own document.
- Why use props? A parent passes data down; children can receive callbacks to communicate user actions upward.
- Why do 2b and 3a look similar? Modern functional components need a hook such as useState for local reactive state; 3a focuses explicitly on the hook.
- Why a model/controller split? It separates storage from HTTP validation and response handling. It is demonstrated without a risky rewrite of the existing backend.
- Is the whole portal microservices? No. The lab demonstrates the concept with a separate service; the portal is a single Express backend.
- Are all 25 programs the same size as the portal? No. Each individual example isolates its question; the complete portal combines real data, workflows and authorization.
