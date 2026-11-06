# Personal courses

`#/course` creates a personal plan from existing lessons, checked answers, and the mastery assessments in `#/map`. Students choose study days, daily minutes, a starting date, an optional target date, and a unit focus. The library remains available without a course.

Recommendations follow prerequisite relationships and prioritize concepts needing review. Marking a lesson complete records reading. Checked questions supply practice evidence; ten questions with at least 80% correct plus a completed essay or project with a substantive self-review can suggest “Secure.” Students can override any state. Current answers include retries; newly recorded first attempts remain separate. Essays are not automatically graded, and mastery states are not AP score predictions.

The initial plan includes a lesson, question set, essay, and concept project as appropriate to the student's evidence. Concept projects and text projects can also be planned from their assignment pages. Adding an application includes its recommended preparation. Literature's classical projects have explicit skill connections; historical text projects use their existing concept connections.

Each study day is allocated to one assignment. Essays and projects span multiple sessions using editable time estimates. Adding tasks or changing mastery does not move existing dates. Changing the study profile, changing a task's estimated time, reopening a completed task, or explicitly rescheduling rebuilds unfinished sessions. Custom due dates remain intact and conflicting estimates are flagged. The target finish date is advisory; it does not compress the workload. Calendar export downloads all-day deadlines as an `.ics` file.

Course data is stored alongside existing work in browser local storage and included in workspace exports. No account, teacher dashboard, or external calendar service is involved. Literature workspace imports merge course records while retaining existing local edits. Students should export their workspace before clearing browser data.

The shared course UI and pure scheduling engine are in `src/course`; each repository has its own content adapter. The code is copied between the two independent sites deliberately. Update the common engine, dashboard, styles, and tests in both repositories when changing shared behavior.

`npm test` includes scheduling, migration, mastery, prerequisite, calendar, and export/merge contracts. With the production preview running on the repository's local port, `npm run test:course` exercises setup, saved-work preservation, actual question submissions, completion notes, map states, custom dates, projects, calendar export, history, responsive layouts, and accessibility.
