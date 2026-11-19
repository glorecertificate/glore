# Course screens

- `/courses` is one card: `FilterRailPanel` (status, type, skill group, language, each with counts from `useCourseListRail`) beside a results column. Learners see `LearnerCourseCard` with the in-progress courses first. Editors keep `CourseListCard` and the sortable grid. "Show more courses" adds 12.
- The course overview is a main column plus a sticky 320 px rail (progress, facts, language select, certificate fact). A completed learner sees the rating and next steps above the outline.
- The lesson player has a 280 px rail and a sticky bar (Previous, step text, one primary). The band keeps the course title as the single `h1`.
- The course editor saves on demand, never on a timer, because a save of a published language is live for learners. Draft language: "Save draft" and "Publish". Published language: "Publish changes", with "Unpublish" in the menu.
- The skill framework is collapsible group cards in a 960 px column. Group order and course assignment use menus, with no drag.
