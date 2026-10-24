# CPMS interactive demonstration

Open `http://127.0.0.1:5173/demo` after starting the frontend. This tour needs no account or database. It uses sample records saved in this browser, and the role selector lets you present the student, recruiter and placement-officer views. Use **Reset demo** for a fresh presentation.

## Five-minute classroom walkthrough

1. Start as **Student**. Show the overview, search opportunities for **PixelWorks**, save the role, open its details and apply. Open **My applications** to show its status and timeline.
2. Switch to **Placement officer**. Open **Candidate pipeline**, choose **List**, and search **PixelWorks Giri**. Move that application to Shortlisted, then Interview. Schedule an interview for a future time.
3. Switch back to **Student**. The updated stage appears in My applications. Open the calendar, select the interview day and download its calendar event. Show Activity and mark the notifications as read.
4. Open **Preparation**. Complete a practice round and tick the preparation checklist. The optional native JavaScript exercise retains the Experiment 1 concepts. It does not decide whether the student can apply.
5. Switch to **Recruiter** and show the board view of TechCorp's candidates. Switch to **Placement officer**, open Reports and export a CSV. Open **Manage companies**, add an opportunity and edit it, then return to Student to find it in Explore opportunities. Back in Manage companies, deletion is disabled for companies with active applications; an unused company can be deleted after confirmation.

The **Demo walkthrough** button provides guidance while presenting. The sidebar also opens the five combined case studies, original basic programs and the three-set source explorer. Those short observation programs remain separate from the larger portfolio interface.

For the calendar demonstration, enter an online meeting's full `https://` URL as its venue to show **Open meeting**. Use **Upcoming** for future/ongoing meetings, **Past** for finished meetings and **Today** to return to the current month and date. **Show all interviews** clears both the date and period filters. Times use the time zone shown below the calendar; Scheduled/In progress/Finished describe the event's time, not the candidate's application stage or attendance.

Search opportunities or applications to show the active-filter chips. Remove one chip or use **Clear filters** to restore the list. On a phone, open the navigation menu and use its close button; keyboard users can use Escape. The notification bell also supports Escape, outside-click dismissal and its own close button.

## Compare roles and plan application deadlines

In Student view, open **Explore opportunities** or **Saved opportunities**. Tick **Compare** on two or three cards and choose **Compare roles**. The table shows compensation, location, work arrangement, openings, skills, deadline and your current application stage. **View role** returns to the existing details and application flow. Selected roles stay available when searching or filtering; remove a chip or use **Clear selection** to start again. Comparison selections last for the current page visit and clear when switching demo roles or resetting the demo.

Choose **Closing within 7 days** in **Application deadline** to focus on approaching dates. **Closing soonest** sorts future deadlines ahead of expired or undated roles. Cards distinguish today's deadline, tomorrow's deadline, later dates and dates that have passed. Labels refresh every minute and when returning to the browser, using its local calendar date.

Open an opportunity with a current or future deadline and choose **Add deadline to calendar**. Import the downloaded `.ics` file into your calendar. It creates an all-day application deadline, including correct month/year rollover; it does not book an interview or submit an application. The exact closing time remains the one published by the placement office or employer. Calendar alerts depend on your calendar settings.

These features use the same company details in the demo and signed-in portal. Comparison is held in React state, the filters use array operations and conditional rendering, and deadline updates use an effect with cleanup. They need no database migration and retain the existing application permissions. On smaller screens, comparison scrolls horizontally within its dialog.

## What is saved where

| Area | Storage and behavior |
| --- | --- |
| `/demo` | Sample applications, stages, interviews, opportunities and profile changes stay in this browser's localStorage. Switching demo roles shares these samples. Reset demo restores the starting samples. |
| Signed-in portal `/` | Company CRUD, applications, withdrawals, staff stage changes, career profiles and opportunity details use protected Express APIs and MySQL. Role and ownership checks remain enforced. |
| Interviews | Staff-created official bookings are shared with the candidate and responsible staff. A student's personal entry is visible only to its creator. Students cannot cancel official bookings. |
| Notifications and activity | Application/stage/withdrawal and official interview updates are stored for the authorized accounts. Read state is account-specific and persists across devices. No email is sent. |
| Browser-local features | Saved roles, demo data and older device-only entries remain in this browser. Existing local entries are retained and labelled; newly created signed-in schedules/profiles use the server. |
| Calendar and reports | Calendar files and CSV reports download to your computer. No email or invitation service is connected. |
| `/manage` | Existing full management screens remain available after sign-in. |

No automatic CGPA, branch, graduation-year or backlog eligibility enforcement was added. Clearing browser site data removes device-saved information. The demo runs entirely with local samples; it does not create or delete records in `cpms`.

For an existing installation, run `npm run db:workspace` inside CPMS once. It creates a private database backup under `.verification/database-backups`, adds the four new tables and verifies existing tables/records are unchanged. The workspace refreshes every 30 seconds while visible and when returning to the window; use Refresh workspace for an immediate update. See [CHANGES.md](CHANGES.md) for the completed changes and remaining production work such as email delivery, resume storage and account recovery.

## Switching sample identities

Use Demo role at the top to choose Student, Recruiter or Placement officer. In Student view, Demo student switches between Giri, Priya Rao, Arun Kumar and Sneha Reddy. Each student has their own profile, applications, saved opportunities and schedule. In Recruiter view, Demo company selects the company whose candidates you want to manage. Return to the same sample student to see changes. Open demo tabs in the same browser and origin share sample updates.

These are sample identities, without passwords. The signed-in portal and demo keep separate records. After changing a real candidate stage while signed in, open the signed-in portal and log in as the corresponding real student; use Refresh workspace if needed. Those changes never replace demo samples. The Open signed-in portal link takes you there.
