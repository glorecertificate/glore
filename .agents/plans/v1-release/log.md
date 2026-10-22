# GloRe v1 release: log

Dated history of the v1 effort. Status, open work, and follow-ups live in `tasks.md`. Entries are 2026-10-22 unless a date says otherwise.

## Planning and W0

### Planner (Opus 5.5)

- Research, user decisions U1 to U7, plan folder, `AGENTS.md` paths, `manual-testing.md`.
- It took the 25-skill list from GloRe's user guide and added "Skill framework", O5, and the effort table in `plan.md`.

### User

- Added `TEST_EMAIL=` to `.env.example` and the real address to `.env.local`, answered O1 to O4 (U8 to U11), and confirmed `MAIL_TRANSPORT=mailpit` in `.env.local`.

### W0.1

- The orchestrator cut `release/v1`, reused Docker Postgres and Mailpit, and started dev.
- Baseline: `check` exit 0, `test` 17 of 17, `test:e2e` 11 of 11, recovery mail reached Mailpit.

### W0.2

- Schema batch in 3 migrations, tested on a dump copy with synthetic certificates and on an empty database.
- After migrating, `check` exit 0, `test` 17 of 17, `test:e2e` 11 of 11.
- A follow-up added `skill_groups.slug` for Lane E's importer.

### W0.3

- `recordEvent` and `notify` with the event catalog.
- Current certificate actions now record and notify.
- Tests 31 of 31.

### W0.4

- Config keys, `SKILL_LEVELS` in `src/lib/constants.ts` with `Common.skillLevels`, and `fullName()` replacing null-printing name joins.

### W0.5

- UI kit built by a resumed session and committed by the orchestrator.
- `ArrowsMotif` waited in `knip` `ignoreFiles` for its first consumer (A2 and D6 consumed it).

### W0.6

- `SEED_PASSWORD` is `Password1!`.
- A `holder` seed volunteer keeps demo certificates away from tests that wipe the volunteer.
- `AUTH_ROLES` covers all seven seed roles.
- `db:seed:demo --target <local|staging>` builds the manual-testing accounts on `TEST_EMAIL` plus-addresses.

### W0.6 staging

- Neon refused `staging` with "branches limit exceeded".
- The user approved deleting the 6 archived Neon preview branches.
- `staging` was created from production and migrated by replaying 0013 to 0022 in one transaction with Drizzle's journal rows.
- Its schema fingerprint equals a fully migrated local database.

### W0.6 marker

- Neon forbids custom database settings, so the staging marker is the database comment `glore:staging`.
- Production has no comment, was 10 migrations behind (0013 to 0022) at that time, and holds 0 certificates.
- G8's runbook must migrate all of them.

### W0.7

- `/api/auth/admin/*` answers 404 over HTTP (server `auth.api` calls unaffected).
- Upload and AI JSON bodies stream with a size cap.
- The manifest reads `?locale=`.
- `react-email` is a dependency.
- `react-spring` stays because `globe.tsx` uses it.

### W0.8

- `TEST_EMAIL` documented in `reference.md`.
- Seed docs moved to `workflow.md` "Seeds" for the budget.

### Orchestrator

- Committed the UI kit, PDF, seed, org-cookie fix, and `.env.example` on `release/v1`, and fixed `typegen` for nested `public/` folders.
- Lane E1 started in `.claude/worktrees/lane-e` (branch `lane/e`).

### Orchestrator

- Merged `lane/e` (E1) into `release/v1-next`.
- After the demo, `release/v1` was fast-forwarded from `release/v1-next` and finished worktrees were removed.
- Lane C leaked one commit's edits into the main checkout; they were restored because `lane/c` holds them.

## Lane A: certificates

### A5 (demo priority)

- Template-faithful PDF through `GET /api/v1/certificates/[id]/pdf`, snapshot and code on approval. en, es, it checked against the template.
- `/verify/[code]` stayed with A6.

### A1

- Lifecycle actions split into `requests`, `assignment`, and `review` under `actions/certificates` with `CertificateError` codes, rate limits, and `commitTransition` (transaction, event, notify).
- Approve reverts on R2 failure.
- New `certificate.unassigned` event.
- Tests 200 of 200 with the lane-a clone.

### A1b

- Tutor load balancing (fewest open requests, ties to the oldest last assignment, authors and banned users skipped) under a per-org advisory lock.
- Tutor queue, pool, and `findCertificate` are scoped to the active org, and drafts stay private.
- Tests 212 of 212.

### A2

- Wizard with autosaving drafts, `?draft=` resume, resubmit mode for `changes_requested`, `EligibilityPanel`, `CertificateThumbnail`.
- The legacy form, resubmit dialog, and client PDF preview were removed.
- `findCertificate` hides the org rating from everyone but the author.
- Tests 227 of 227.

### A3

- Tutor workspace.
- `/certificates` is a `DataTable` queue (assigned, unassigned self-claim, completed) with nuqs filters and fresh, due, and overdue age badges from `reviewReminderDays`.
- The review page shows the request, course results, and previous feedback beside the form.
- Approve renders the real PDF through `previewCertificatePdf` first.
- New `findReviewContext` query.
- Tests 232 of 232.

### A4

- Wallet with `CertificatePreview`, `FeaturedCredentialCard`, and `EligibilityPanel`.
- Detail page built from `CertificateJourney`, `CertificateFeedback`, `CertificateTimeline`, `CertificateSummary`, `CertificateActions`, and `CertificateShare`.
- One-time confetti.
- New `featureCertificate` action, `recordFeaturedCertificate` mutation, `VERIFY_ROOT` constant.
- Tests 240 of 240.

### A6

- Public verification (`verifyCertificate`, IP rate limits, 404 for unknown and non-public statuses, a revoked certificate never exposes its reason).
- `/{username}` is opt-in (`users.publicProfile`) and `?v={handle}` permanently redirects to `/verify/<code>`.
- `src/proxy.ts` makes `/verify` public.
- Added `normalizeCertificateCode` and `e2e/verify.spec.ts` with `e2e/db.ts` seeding helpers (not run in the lane).
- Tests 257 of 257.
- Lane D owed the `publicProfile` toggle and reserved usernames for every top-level `src/app` segment (D5 and D6 delivered them).

### A7

- `OrganizationCertificates` (pipeline `StatCard`s, search, status and reviewer filters, reassign, revoke, view) plus `listOrganizationCertificates(orgId)`.
- Mounted on `/certificates` for org admins and representatives.
- The tutor queue and pipeline follow the active organization's role.
- Tests 259 of 259.

### Orchestrator

- Lane A part 2 (A2, A3, A4, A6, A7) and E4 merged.
- Fixes: `useDevice` hydration on narrow screens (e933cd8e) and a client-only `Markdown` imported by a server page (cfb62988).
- `next build` passes.
- Specs were split for the budget (aa24bd99).

## Lane B: organizations and admin

### B1

- Invitation lifecycle in `db/mutations/invitation.ts`.
- Acceptance is the only path to a membership.
- Added `/invite/[token]`, `/join/[token]`, the Invitations and Requests tabs, and the bulk invite dialog.
- Tests: 30 DB-backed.
- Browser and e2e not run.

### B1b

- `removeMembership` revokes the links and open invitations a removed member created and deletes their unaccepted legacy join tokens.
- `approveOrganization`, `inviteOrganization`, and admin member invites send invitations instead of creating accounts or memberships.
- The org invite dialog no longer collects the representative's name.
- `.oxlintrc.json` turns off `server-sequential-independent-await` for `src/db/mutations/**`.
- Tests: 7 DB-backed.

### B1 security fixes

- The panel payload no longer carries invitation or invite link tokens.
- `copyOrganizationInvitationLink` and `copyOrganizationInviteLink` serve a link on demand after the role check (`canManageInvitation`).
- Creating an account through `/invite/[token]` needs a one-time emailed `proof` (hash in `verifications`), and `requestInvitationProof` mails a fresh proof link.

### B2

- Members `DataTable` with detail drawer.
- Owner-only role change, remove, leave, and ownership transfer (typed org name, mails both) are `memberError`-coded mutations in `db/mutations/organization.ts`.
- Demoting, removing, or losing a tutor returns open reviews to the pool.
- `getOrganizationAccess(organizationId?)` lets platform admins reuse the org actions. 12 DB-backed tests.

### B3

- Shared `OrganizationSettings`: branding, details, per-locale description merged server-side, legal name, and registry ID.
- It also holds the signatory (`legalRepresentative` and a PNG or JPG signature) and the danger zone with a `HAS_CERTIFICATES`-guarded delete.
- Used by `/organization` and `/admin/organizations/[id]`.
- Admin duplicates of the org actions were removed.

### B4

- Overview with first-run checklist, pipeline, members by role, and recent activity.
- New `certificates`, `insights` (rating aggregate hidden below 3), and `activity` (cursor-paged) tabs.
- Pure helpers in `db/queries/organization-insights.ts` with tests.

### B5

- `/register` four-step application stored in `organization_profiles`, receipt and platform admin mails, `organization.application_received`.
- `/admin/organizations` gets an application sheet and a rejection mutation (`organization.application_decided`).
- `e2e/organization-application.spec.ts` written, not run.

### B6 users

- `/admin/users` is server paged (`listAdminUsers`, `DataTable` gained a `pagination` server mode).
- Ban needs a 10 to 500 character reason and an optional expiry, unban records `account.reinstated`, role changes go through `setPlatformRole` (advisory lock, last-admin guard).
- Impersonation followed D18 first through a local plugin, replaced later by H3.

### B6 team

- `resendInvitation` refreshes the token and expiry through `refreshTeamInvitation` with a 60 second cooldown, and revives expired invitations.
- Invite and resend record `team.invited` and send through `notify`.
- `INVITATION_EXPIRY_DAYS` was removed in favor of `invitationExpiryDays`.

### B6 certificates

- `/admin/certificates` is a server paged lookup (`searchAdminCertificates`).
- Picking an organization mounts `OrganizationCertificatesPanel`.
- Lane A fix: `/certificates/[id]` returned not found for platform admins, so admins now pass and `/certificates` redirects them to `/admin/certificates`.

### B6 audit and overview

- `/admin/audit` is a server paged log of eight audited actions in five categories (`listAdminAudit`, pure `toAuditRows`).
- `getAdminOverview()` returns totals, 12 months of series, and review times in one `'use cache'` entry tagged `CacheTag.AdminOverview`.
- The sidebar entries for `/admin/certificates` and `/admin/audit` now exist in `navigation.ts`.

### B6 tests

- Certificate codes are generated per run, audit fixtures use a non-numeric subject, and the last-admin test takes the platform-admins advisory lock.
- Five consecutive full runs passed (528 of 528).

## Lane C: learning

### C1

- Member overview at `/courses/[slug]` with explicit `startCourse`, editor kept for editors, auto-enroll removed.

### C2

- Player with server-side grading (`answerQuestion`, `completeLesson`), no `isCorrect` in the payload (Vitest proves it), retries with explanations,
  - Evaluation and assessment gating (rating plus 40 to 1,000 char reflection), viewer mode writes nothing, `course.completed` and first-time `learning.eligible` events.

### C3

- `/courses/[slug]/complete` (summary with `LevelDots`, `rateCourse` upsert into `course_ratings` after completion only, recommended course, certificate CTA from `evaluateEligibility`).

### C4

- Duration and outcomes in course settings, `/courses/skills` framework CRUD, translation coverage, preview-as-learner, real analytics with an error state, awaited `reorderCourses` with rollback.
- `e2e/course-editor.spec.ts` written, not run.

### C5

- Slim catalog (`queryCatalog`: no lesson `content` or `isCorrect` in SQL, no 200-course cap), NaN progress fixed, learner cards, skill compass (`saveSkillCompass`) with recommendations.

### C6

- Docs category empty state, articles at `/docs/articles/[slug]`, and `useDocsSearch` for the palette.

### Orchestrator

- E2 batch 5 and lanes B and C merged into `release/v1`.
- All 25 skill courses are in `content/`.
- E2 batches 1 to 3 had merged earlier (15 of 25).
- Spanish and Italian skill names are standard terms except the few glorecertificate.net confirms.

## Lane D and E

### D1

- `NotificationBell`, popover with day groups, `/notifications` with filters, `inbox.ts` actions, `usePoll`.
- Every in-app event has copy in en, es, it (Vitest checks the catalog).
- `e2e/notifications.spec.ts` written, not run.

### D2

- Email layout refresh (header image, reason and preference link, `List-Unsubscribe` and `/api/v1/mail-preferences`), `TEMPLATES` registry, 9 new templates, real expiry copy.
- `organization/member-added` removed and `auth/invite` now only carries the invitation email proof.
- Vitest renders every template in en, es, it.

### D3

- Daily cron `/api/v1/cron/daily` replaces `cleanup` (`isAuthorizedCron`, `runDailyMaintenance`).
- Reminders, escalations, and pruning are idempotent through `activity_events`.
- Fixed-clock Vitest for the planners and a DB-backed prune test.

### D4

- Four-step onboarding stepper, welcome screen with username and a role-aware next step.
- `completeOnboarding` records and notifies `account.welcome` in one transaction.
- `lib/username.ts` holds the reserved list.
- Invited accounts have an empty first name and a random password.
- `e2e/onboarding.spec.ts` written, not run (needs Mailpit).

### D5

- Settings tabs and `actions/account/`.
- Deletion is no longer blocked by certificates, only the sole administrator gets a transfer prompt, and `account.deleted` is recorded and mailed.
- `e2e/settings.spec.ts` written, not run.

### D6

- Login accepts usernames from 3 characters, `ArrowsMotif` in the auth layout, `PwaInstallPrompt`,
  - Public legal pages rendered by `react-markdown` and `remark-gfm` from `content/legal/<doc>.<locale>.md`, `LEGAL_ROOTS` in the proxy.
- `e2e/public-pages.spec.ts` written, not run.

### Orchestrator

- Lane D merged (d8612e29).
- Fix: `EmailContext` called `createContext` in the RSC layer, which broke every route in dev, so the category is now a base prop.

### E1

- `content/` format, `content:check`, `content:import` with the `yaml` dev dependency, spec in `content/README.md`.

### E3 and E5 merged

- 2 intro and 4 learner courses (3 lessons each) and 9 temporary legal texts in `content/legal/` with `[... to be confirmed]` placeholders.
- D6 renders them and B5 links its charter checkbox to `/quality-charter`.

### E4

- Docs format and importer (`content/docs`, ordered by `created_at` from `sortOrder`), then 33 docs in en, es, it (Intro 4, Tutorials 7, FAQ 22).
- Imported into a local clone, second run unchanged.

### Lane i18n

- `crowdin.yml` maps `messages/en.json` and `content/legal/*.en.md` to es and it (`config lint` passes; verify the legal naming with the first Crowdin sync).
- `pnpm run check:i18n` found a real bug: `Components.RichTextEditor.ai.continueEmptyWritingPrompt` carried an unbound `{editor}` argument in es and it (fixed).

### Lane i18n email previews

- `/admin/emails` was a security slip (the admin layout admitted editors).
- The previews moved to `/emails` (added to `DASHBOARD_ROOTS`) and `loadEmailPreview` checks `isAdmin || canEdit` itself.
- Vitest covers an editor, a plain member, and the admin guards.

## Lane F, QA, and fixes

### F2

- `components/layout/navigation.ts` is the tested per-role table behind the sidebar and palette (D25).
- `OrganizationSwitcher`, pending invitations (`actions/shell/invitations.ts`), and the palette with server-scoped lookups (`actions/shell/search.ts`, `scope.ts`) behind `searchShortcut`.

### F1

- `/dashboard` is a server-loaded view per role from `loadDashboard` (read-only, server-only).
- Removed the synthetic trend chart, dead buttons, the dashboard `CoursesProvider`, `Sparkline`, and `RadialProgress`.
- Vitest 30 tests.
- `e2e/dashboard.spec.ts` written, not run.

### F4

- `/admin` renders `getAdminOverview()` with four `StatCard`s, two lazy `Chart`s, the pipeline, review time, and shortcuts.
- The `next.config.ts` redirect is gone.
- Merged (71fcff56) and checked in the browser as admin at 1280px, 390px, and dark mode.
- Fix: the `Chart` screen-reader table used `sr-only` on a `<table>`, which scrolled `/admin` and `/dashboard` sideways at 390px.

### Lane fix, docs and verification

- `/docs` with no categories renders an empty state.
- The revoke mail was not reproducible (the check ran before D2's `certificate/decision` template; a Vitest through `notify` proves it).
- A revoked `/verify/<code>` shows only the badge, holder, organization, revocation date, code, and issue date, and the PDF route answers 410.

### Lane fix, layout

- Course list tabs scroll inside their container, the mobile editor toolbar shows below `md` for editors, the lesson sidebar keeps its 18rem width,
  - The "Written by" line hides without contributors, and `pickCourseTitle` replaces the raw slug in the compass and framework.

### Lane fix, test order

- The certificate test harness sorts course ids and orders reloaded skills (`requests.test.ts` passed 6 of 6 runs, full suite 3 of 3, 506 tests).

### Lane delete

- User decision "Anonymize" for account deletion (migration `0023_anonymize_deleted_holders`).
- H1 decision 3 reversed it (see H1).

### qa1

- `Card` dropped `h-full` and `justify-between`.
- Sessions record the user agent and address, and `listSessions` lists at most 20 unexpired sessions.
- The deletion prompt points at organization Settings, Danger zone.
- The ownership notification has per-recipient `variant`s.
- New `organization/application-decision` template.
- Every organization event type has activity copy (Vitest).
- `announceNotificationsChanged` refreshes the bell at once.
- Admin organization actions use `updateTag`.

### Orchestrator, qa1

- Merged (70fc6045).
- E2e drift was root-caused: the verify fixture code held an `L`, which `normalizeCertificateCode` maps to `1`.
- The course editor specs need serial mode.
- Notifications and settings clicked before hydration (`hydrated()` in `e2e/helpers.ts`, `pruneSessions` in `e2e/db.ts`).
- Real fixes: `CountrySelect` forwards control props, and four account actions expire `userTag` with `updateTag`.
- The five specs pass with `--workers=2`.

### Orchestrator

- `/verify` logged "unstable value `Date.now()` while prerendering" on every load because `checkRateLimit` read the clock after `headers()`.
- Fix: `await connection()` first (Vitest `src/lib/rate-limit.test.ts`).
- A build check is still due in G6.

### Orchestrator, qa1 browser check passed

- Card heights, sessions, ownership notifications, mail previews, activity feed, bell badge, 390px tab bars, register alignment, member plurals.
- The FAQ needed `pnpm run content:import --target local` because docs live in the DB.

### G1

- `db:seed:demo --target local` builds the full demo state.
- It holds 3 organizations, 28 accounts, 18 certificates in every status plus a deleted holder, progress, ratings, invitations, a link, requests, 117 events, and 65 notifications.
- It ran twice on fresh databases with identical counts.
- Merged (10a80f9a).
- Local browser check passed 6 of 8 flows.
- The volunteer wallet crash was F3 B1.

### F3 batch B (f3b)

- `success-text` and `info-text` tokens, darker `destructive-text` in light, every status text uses its `-text` token, meaningful `text-muted-foreground/NN` lost its opacity.

### F3 batch D (f3b)

- Help join steps and FAQ describe invitations and invite links, the PDF signatory is the organization's legal representative, "Log in" and "Log out" replace mixed wording,
  - `…` replaces three dots, es uses informal tu, status badges and roles are localized.

### F3 B1 (f3a)

- A draft saved with empty activity dates crashed the volunteer `/certificates` list.
- Added `formatActivityDate` and `formatActivityPeriod` in `certificates/rules.ts` so an unset date renders `-`.

### F3 batch A (f3a)

- Accessibility pass (`<html lang>` fallback, zoomable viewport, header title as the page `h1`, named controls, `Progress` forwards `value`, light `--ring` darkened to 4.1:1).

### F3 batch C (f3a)

- 390px layouts (single-column grids, `DataTable` labeled cards below `sm`, `TabsList` fade edges, styled `Markdown` defaults, compact courses toolbar).

### Orchestrator

- F3 merged (f3b b32f2365, f3a e6c6a103).
- E2e drift fixed in specs only.
- Full suite with `--workers=2`: 64 passed.

### H2 (F3 gaps)

- Sr-only `h1` from `title` when a breadcrumb replaces the header (514f40ba).
- Contrast fixes with the full `--ring` in light and a darker `--sidebar-ring` (5927e36a).
- Overflow fixes in docs nav, `/admin/certificates`, and `/admin/audit` (45dfa4f6).
- `DataTable` "Sort by" select below `sm` (a57aaade).
- `actions/admin/expire.ts` fixes stale admin data (dc78b017).
- `/login` sets `title.absolute` through `appTitle()`.

## H lanes

### H1 decision 1

- Removed the legal temporary banners.
- Legal text is read from files, so `content:import` is not needed for it.

### H1 decision 2

- The organization role `admin` reads Owner (en), Administrador/a (es), Amministratore (it) through the catalogs.
- Platform admins read Admin in all three languages.
- Notifications pick `Notifications.teamRoles` for `team.*` events.
- Invitation copy says "someone from your organization" (U16).
- Docs changed, so `content:import` must rerun.

### H1 decision 4

- The Spanish `Auth.loginTitle` and `Auth.loginMetaTitle` read "Únete a la red GloRe".

### H1 decision 3 and U17

- Issued certificates stay valid after the holder deletes the account (reverses c7a1c65b, no schema change).
- `detachIssuedCertificates` nulls `user_id`, sets `holder_deleted_at`, and clears `is_default`.
- `/verify/<code>` renders the snapshot with `holderDeleted`.
- Managers, platform admins, and the reviewer can open the detail page and the PDF.
- The privacy policy gains the staff view-as-user sentence.
- Rerun `content:import` and `db:seed:demo`.

### H3

- The local impersonation plugin and its custom `admin_session` cookie format are gone.
- `admin()` runs with `allowImpersonatingAdmins: false`.
- `sessions.impersonated_by` (migration `0024_impersonated_by.sql`, cascade) marks the session.
- The proxy deletes an expired impersonation session on the next request, so `ImpersonationNotice` auto stops 3 seconds before the expiry.
- Production needs migration 0024.
- Details live in `admin.md`.

### H4

- Editor AI restored on the Gemini free tier.
- Root causes: `ai-menu.tsx` never registered the `useChat` helpers on `AIChatPlugin`, `chatOptions.api` is gone in `@ai-sdk/react` 3 (now `DefaultChatTransport`), and `gemini-2.0-flash` was retired.
- New `src/lib/ai.ts` with the `aiModels` chain.
- Follow-up: a model under high demand queued for about 98 s, so a model with no first token within `aiFirstTokenMs` (8000) is aborted and the next one runs.
- The command route's copied `smoothStream` dropped the text delta `id`, which AI SDK 6 rejects, so it keeps the id.

### H5

- `/login` keeps the ` · GloRe Certificate` suffix after hydration (`defaultAuthView`, `authMetaTitleKey`).
- `/admin/organizations/<id>` title is the organization name.
- Settings section headings are `h2`.
- `PhoneInput` pairs `aria-controls` with a `useId` popover id.
- `MultiSelectBadge` titles use `Components.MultiSelect.removeNamed`.
- `/admin/users` has no detail route.

### G5 (2026-10-23)

- Every PDF template text baseline lands within 0.6 pt in en (was up to 4.6 pt high).
- Root cause: template tops are PyMuPDF line boxes while react-pdf sets the first baseline at top plus the Roboto hhea ascent, so `placed(top, size)` in `document.tsx` converts every template top.
- Notes in `pdf.md` "Text placement".
