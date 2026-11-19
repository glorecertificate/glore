# GloRe Certificate app specification

## Domain context

- GloRe (short for "Global Recognition") certifies the soft skills people gain through volunteering.
- It turns non-formal learning into a credential someone can add to a CV.
- It exists because volunteering is real learning that traditional qualifications do not capture, and HR and educational institutions need a verifiable signal for it.
- Organizations onboard members who complete structured courses, accumulate skill ratings, and submit certificates that tutors review.
- The app is available in English, Spanish, and Italian.
- [Associazione Joint](https://associazionejoint.org) runs the product. It is a Milan non-profit founded in 2003.
- It is active in youth mobility, European volunteering, and non-formal education through Erasmus+ and the European Solidarity Corps.
- GloRe started as an Erasmus+ Capacity Building project (2016 to 2018).
- It grew into the GloRe Network, an open, free-to-join set of NGOs across Europe and Latin America that issue certificates under shared quality standards.
- This repository is the new version of the platform. It replaces the live sites at `international.glorecertificate.net` and `local.glorecertificate.net` (launched March 2021).
- It is not a clone of them: terminology and flows here follow this codebase's data model, not the legacy sites.

### Domain facts

Three domain facts shape recurring decisions:

- Network of organizations: volunteers join through a member NGO, never as standalone users. The org, membership, and role model plus the registration-as-join-request flow follow from this.
- Soft skills as the unit of value: skill courses map to the transferable competences GloRe certifies (problem-solving, teamwork, leadership, empathy, and similar).
- Assessment ratings on those courses gate certificate eligibility.
- Recognition needs trust: tutor review, the approved-then-immutable certificate, the verified public page, and the QR-linked PDF exist so a third party can trust the credential.

## Users and roles

### Team roles (platform-level)

- The `isAdmin` and `isEditor` flags on the user record set team roles, independent of any organization.
- Team members always see the admin or editor interface, never the org member view.

| Role     | Permissions                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `admin`  | Full access: user management, org approval and creation, course management, admin panel, team invitations |
| `editor` | Create, edit, translate, and manage courses only. No user or org management, no admin panel               |

### Organization roles (per-membership)

- Non-team users hold a role per organization.
- A user can hold different roles across orgs and switch the active one, stored in a cookie like switching workspaces.

| Role             | Permissions                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `admin` (owner)  | Sole owner, exactly ONE per org. Full org management including deletion. Main point of contact    |
| `representative` | Owner's rights except deletion. Invite members, manage roles, assign tutors. Multiple allowed     |
| `tutor`          | Review certificates assigned to them, self-assign to unreviewed ones. No org or member management |
| `volunteer`      | Enroll in courses, complete lessons, submit evaluations and assessments, request certificates     |
| `learner`        | Enroll in intro and learner courses only. No skill courses, no certificates                       |

- The membership role `admin` is labeled Owner (en), Administrador/a (es), and Amministratore (it) everywhere users see it. The stored value, enums, and identifiers stay `admin`.
- The platform `admin` team role is labeled Admin in all three languages, so the two never share a label.
- The single `admin` is set at registration or by team invitation. The last admin cannot be removed or demoted.
- Use `isOrgAdmin || isRepresentative` for management checks. `isOrgAdmin` alone is owner-only.
- Use `membership.role === 'admin'` for owner-exclusive operations such as deletion.

## Core features

### Authentication

- Email and password through Better Auth: verification, password reset, and profile management.
- The login field takes the email or the username (3 characters or more).
- The auth flow shows the animated globe above the form. Its color follows the view (`decisions.md`, U21).
- Sessions live in signed HTTP-only cookies (`gl_` prefix). There is no SSO or OAuth.

### Registration and onboarding

- `/register` is a multi-step application (`organizations.md`) that creates a `pending` org and a join request.
- A platform admin approves the request, which sends an invitation, or rejects it.
- Rejection is soft: the admin join request moves to `rejected` and the org record stays visible to platform admins.
- On first login with a null `onboardedAt`, the proxy redirects to `/onboarding`.
- `/onboarding` is a four-step stepper: names, birthday with nationality and place of birth, optional phone with language, and password.
- The password step has a required terms checkbox. Completion records it with `acceptCurrentLegal` in the same transaction.
- A welcome screen follows with the generated username and a role-aware next step.
- Next step by role: tutor to the review queue, admin or representative to `/organization`, learner or volunteer to the skill compass, otherwise the catalog.
- Completion saves the profile, the chosen credential password (`setCredentialPassword`), and `account.welcome` in one transaction, so a failed or lost submission never changes the password. The event mails the username.
- Invited accounts arrive with an empty first name and a random password, so the stepper always collects both.

### Organizations

- `/organization` has tabs: overview (member and certificate stats, pending requests), members (roles), invitations (pending list, invite links), requests (join request approval), and settings.
- Settings cover name, email, description, address, phone, URL, and logo. The org switcher sits alongside.
- Deletion is owner-only and blocked unless the org has zero certificates.

### Courses

- Editors and admins author multilingual content in Plate.js with AI assistance.
- Ordered lessons hold rich text, multiple-choice questions, evaluations (self-assessment prompts), and one final assessment per lesson (skill courses only, last step).
- Members see an overview and enroll with an explicit Start, which records the locale. Progress is binary per lesson.
- Start and the first lesson open one confirmation dialog. Confirming enrolls the member and opens the first lesson.
- A lesson link of a course that is not started shows a start prompt, not a redirect.
- Volunteers keep a skill compass (up to 3 strengths, 5 goals) that drives course recommendations.
- The server grades quizzes and returns the explanation of each answer. There are no streaks or leaderboards (D15).
- Publication states: archived, draft, partial, published.
- Course types: `intro` (all members, not skill-linked, no assessment), `skill` (volunteers, counts toward certification, has assessment), `learner` (learners, not skill-linked, no assessment).

### Certificates

- Volunteers certify each skill by a blind choice among three level descriptions in the last lesson of the course. They submit a certificate tied to a volunteering experience: selected skill courses, language, activity dates, duration, location, description, and an organization rating of 1 to 5.
- Submission auto-assigns a tutor. Approval generates the PDF.
- `/verify/<code>` is the canonical public page (`certificates.md`, "Public verification").
- `/{username}` shows the featured certificate for holders who opted in.
- The public page shows a verified badge, volunteer and org, activity metrics, issued date, PDF download, QR code, share meta (Open Graph, Twitter Card), and a join-GloRe CTA.

### AI writing assistant

- The Plate.js editor offers slash commands (`/api/v1/ai/command`: generate, improve, summarize, translate).
- Google Gemini only, through `@ai-sdk/google` and `GEMINI_API_KEY` (free tier).
- The model chain is `aiModels` in `config/app.json` (`gemini-3.8-flash`, then `gemini-3.5-flash-lite`). `GEMINI_MODEL` is an optional override tried first.
- `src/lib/ai.ts` moves to the next model when one fails before any text streams (404 retired, 429 quota, 5xx).
- It also moves on when a model sends no first token within `aiFirstTokenMs`, because an overloaded model queues requests instead of failing. The last model has no limit.
- A failure after streaming starts is an error part.
- A missing key answers 503 `ai_not_configured`.
- The menu shows a translated error with retry.

### Content translation

- `content_translations` has one row per entity (`course`, `lesson`, `doc_article`, `doc_category`, `skill_group`) and non-default locale: status (`machine`, `draft`, `reviewed`), `source_hash`, translator and reviewer.
- `classifyTranslation` (`db/queries/content-translation.ts`) derives the state. No content is `missing`, content without a row is `draft`, and a `source_hash` that differs from the current English text is `outdated`.
- A course covers its title, description, and outcomes. Each lesson is its own target (title, content, questions, options, evaluations, assessment descriptions).
- A manual save in a non-default locale sets `draft` and keeps the old hash, so a stale locale stays `outdated` until review or re-translation.
- Mark as reviewed stores the current hash and records `content.translation_reviewed`.
- Doc categories have no editor UI. The skill group dialog shows no review status.
- `translateEntity` (`actions/translations/ai.ts`) translates one entity per call, and the client loops over a course and its lessons. Human text needs `overwrite`.
- AI translation is limited to 150 an hour per editor (`content-translate:<id>`, `RATE_LIMITED`). Every translation write expires `CacheTag.ContentTranslations` (`expireTranslationCaches`).
- It validates keys, placeholders, link URLs, and length before saving as `machine`. `src/lib/translate.ts` skips code blocks, inline code, and text without letters.
- The course editor translates with AI from any language that has text. The Translate button beside the lesson tabs lists the other languages that have text for the current lesson ("Translate from <language>", or a message when none has). A selection translates the lesson title, body, and activities (questions, options, explanations, evaluations, assessment) into the editing language and replaces the text there without confirmation. It is disabled for an unsaved lesson. There is no whole-course translation. The course title and description have their own field menus (shown while the field is focused) with the same source list.
- Both menus call `POST /api/v1/ai/translate` (NDJSON stream, 2 runs per user, 3000 units an hour). The result lands in the draft as unsaved changes and is the current text. A result is dropped if the field changed after the run started. The normal save path applies (`markTranslationsEdited`). There is no per-field origin and no review step in the course editor.
- The doc article editor uses the same flow on the draft (`docs/article-editor/translation.tsx`, `field-translate-button.tsx`): the title and excerpt have focus-revealed field menus, and the Translate menu beside the language tabs translates title, excerpt, and body (as a Plate value, saved back as markdown). It has no status or review step.
- The skill group dialog (Add and Edit, `skill-framework/group-dialog.tsx`) uses the same flow on its own state. It has the icon picker first, language tabs with a status dot (green when the locale has a name and a description, grey otherwise, plus a warning dot for unsaved edits), one name input and one description textarea. Each label row has an always visible translate button (`group-field-translate.tsx`) with a source menu of the other locales that have text for the field (a disabled message when none). The result lands in the dialog as unsaved text and saves with the dialog. There are no review cards. `translateEntity` and `reviewTranslation` have no UI user left.
- `doc_articles.languages` publishes a doc per locale next to the `published` master switch, and unpublished locales are blanked for non-editors.
- Changing `courses.languages` or `doc_articles.languages` records `course.locale_published` or `doc.locale_published`.
- The editor dashboard shows reviewed and translated counts per locale (`actions/translations/coverage.ts`).

### Skill level descriptions

- A skill course's final assessment holds three descriptions, one per `skill_level` (`intermediate`, `good`, `advanced`). Each is an `IntlRecord` of at most 200 characters (`skill_level_descriptions`, unique on assessment and level, deleted with the assessment).
- Only admins and editors write them. Tutors and members never edit them. Later PRs show them to volunteers in random order without the level (#140).
- The editor edits them in the final assessment card of the last lesson (`course-editor/lesson-activities.tsx`, `LevelsItem`), added through "Add activity". On a skill course the card shows the three level fields instead of the prompt, with a 200-character counter each.
- They live in the editor state (`assessment.levelDescriptions`, `tempId()` for new rows) and save through the normal course save (`context.tsx`). `upsertLevelDescriptions` and `deleteLevelDescriptions` (`actions/courses/management.ts`) require an editor, at most 200 characters, and a skill course. A row emptied in every locale is deleted. Only editors load the rows with the course (`buildCourseWith`, `catalog: false`).
- They are fields of the last lesson's translation entity (`lessonTarget`), so the course translation popover and the coverage count them with the lesson. The editor tab percentages count them too.
- `pnpm run content:levels --target <local|staging|production>` reads the `levels:` map of each skill course's last lesson (`content/README.md`) and inserts the missing rows. It never updates an existing row and is allowed on production. It marks the lesson as `machine` in `es` and `it`. `db:seed` runs the same insert (`scripts/seed-levels.mts`).
- Read path for other features: `fetchLevelDescriptions(courseIds)` (`actions/courses/level-descriptions.ts`, cached, tag `courses`) resolves the rows through each course's assessment. It returns `Record<courseId, Partial<Record<SkillLevel, IntlRecord & { id }>>>`, built by the pure `parseSkillLevelDescriptions`.

### File storage and email

- Cloudflare R2 (`@aws-sdk/client-s3`) stores user avatars, org logos, editor media, and certificate PDFs. Certificate PDFs are public through `documentUrl`.
- SMTP through Nodemailer sends mail at registration, password reset, organization and team invitations, certificate assignment, review decisions, join-request decisions, and password and email changes.

### Admin panel

- `/admin`: overview with decisions, totals, the certificate pipeline, a monthly certificate chart, and content health.
- `/admin/team`: invite admins and editors, manage team roles.
- `/admin/users`: server-paged search and filters, ban with reason and expiry, unban, platform roles, and view as user for 15 minutes with an audit log (`admin.md`).
- `/admin/organizations` and `/admin/organizations/[id]`: approve or reject pending orgs, invite new orgs.

### Dashboard

- `/dashboard` renders one server-loaded view per role (`loadDashboard` in `actions/dashboard/`, reusing the certificate, course, organization, and notification reads).
- Volunteer: the band greets the volunteer. Below it, the journey rail card (learn, request, review, certificate, with the wizard steps of an open request and the other courses on the path) sits beside one stage card with the phase title, status badge, status sentence, skill seals, and the actions by phase (primary, preview, download or share). The tutor note and flagged steps show in the stage card. Below `lg`, the stage card comes first and the rail stacks under it.
- Learner: checklist, continue, recommendations.
- Tutor: the welcome card shows the workload and a Start next review action (average review time only from five reviews). "Needs your review" lists the five oldest requests with the queue age badge, a row button, and one queue link, then the latest updates. A `changes_requested` row shows its age as plain text.
- Representative and owner: the band holds Invite members. The main column has the setup checklist, the shared `AttentionList` (join requests, changes requested, expired invitations with Resend, built by `buildAttention` in `db/queries/organization-attention.ts` and carried by the organization panel data), and recent activity. The rail shows non-zero certificate statuses and member roles (`features/organization/overview-rail.tsx`). The organization overview tab reuses the same list and rail.
- Editor: content health, translation gaps, then enrollment charts. The admin overview owns the pending decisions.
- Users without an organization see an empty state (`dashboard/no-organization.tsx`). `/courses` shows the same state instead of the catalog (`course-list/content.tsx`), because every course would open as not found.
- Each view owns the page `h1` and the header bar shows no title, on purpose (#151): two `h1` elements would repeat the page name.
- The learner, tutor, representative and owner, and editor views open with `DashboardHero`, the welcome card (decisions.md, U22): a gradient card with the greeting as `h1`, the subtitle, the organization, one action, and the animated globe at 25 to 30% opacity in the top-right corner. `DashboardHero` places its actions under the text.
- `DashboardHero` is a client island. `Globe` renders its canvas in the server HTML and loads `cobe` after hydration at pixel ratio 0.5 (1.5 at most on phones), because a `next/dynamic` mount added about 100 ms to the dashboard client navigation and the full ratio starved the main thread in software WebGL. The card renders without the globe when WebGL is off.
- Empty cards use `DashboardEmpty` (icon and title).

### Documentation

- `/docs` with `/docs/intro`, `/docs/faq`, `/docs/tutorials`: live-editable guides authored by admins and editors.
  - `doc_articles.audiences` lists the help roles of an article (`volunteer`, `learner`, `tutor`, `manager`, `team`). An empty list means everyone.
  - Lists, search, and previous and next links show a user only the articles for their help role (`useHelpRole`). The team sees all articles, with audience badges.
  - A direct link to an article for another role still opens.
  - The "Still need help?" card shows only to users who cannot edit the docs. Editors and admins do not see it.

### Settings

- `/settings` has the tabs below.
- Profile: avatar, name, bio, phone, birthday, sex, pronouns, city, country, spoken languages.
- Account: language, email change by confirmation link, username checked against `RESERVED_USERNAMES` in `src/lib/username.ts`.
- Privacy: public profile switch (off by default) and featured certificate.
- Notifications: optional email categories learning, organization, and reminders. Mandatory mail and the inbox stay on.
- Security: password and active sessions with revoke.
- Data: JSON export and delete account.
- Deleting works with certificates and course authorship, deletes drafts and open requests, keeps issued certificates valid (`certificates.md`, "Account deletion"), and mails a confirmation.
- Only the sole administrator of an organization is blocked from deleting, and gets a transfer prompt.

### PWA

- The dynamic manifest comes from `/api/v1/manifest`. Display modes: TWA, Standalone, MinimalUI, Fullscreen, Browser.
- `PwaInstallPrompt` (root layout) toasts an install offer 4 seconds after load when the browser fired `beforeinstallprompt`, or an iOS Share hint.
- It snoozes the prompt for 14 days in `localStorage`.

## Organizations

Invitations, invite links, members, ownership, settings, insights, and applications: `organizations.md`.

## Certificates

Lifecycle (eligibility, request, review, approval, revocation), screens, the PDF, and public verification: `certificates.md`.

## Business rules

Rules not already stated above or in `certificates.md`:

1. A user without `onboardedAt` cannot reach dashboard routes. The proxy redirects to `/onboarding`, and an onboarded user hitting `/onboarding` goes to `/dashboard`.
2. Only `isAdmin` users reach `/admin`.
3. Only `isEditor` or `isAdmin` users edit courses. Everyone else gets viewer mode.
4. One active organization per session, held in a cookie. Switching org reloads the dashboard context.
5. Once `approved`, a certificate is immutable and checkable by its code at `/verify/<code>`. The personal profile page stays opt-in.
6. All user-facing strings go through next-intl. No hardcoded UI text.
7. App cookies use the `gl_` prefix (`COOKIE_PREFIX` in `src/lib/cookies.ts`). Better Auth uses `gl` through `advanced.cookiePrefix`. The locale cookie `NEXT_LOCALE` has no prefix.
8. A course becomes `published`, meaning visible to learners, once all its lessons have content.
9. Non-editors never see draft, archived, or off-track courses. The course list and the command palette share `isListedCourse` (`features/courses/visibility.ts`).
10. The app sets only essential cookies and uses cookieless Vercel Analytics, so it shows no cookie banner (D24).

## Data model

- The Drizzle schema in `src/db/schema/` is the source of truth: per-table files, enums in `enums.ts`, relations in `relations.ts`.
- Do not duplicate column lists here. Enum values are listed in `patterns.md`.

## Out of scope

- Real-time collaboration on course content.
- Payment or subscription management.
- Video hosting (embedded from external sources).
- Native mobile apps (the PWA covers mobile).
- SSO or OAuth login (email and password only).
