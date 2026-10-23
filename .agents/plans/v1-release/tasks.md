# GloRe v1 release: tasks

Executable checklist and live status. Rules and IDs come from `spec.md` and `plan.md`. History and per-task notes: `log.md`.

## Status

- State: in progress, the user gave the go on 2026-10-22.
- Current wave: W3 (verification and release readiness). W0 to W2 are merged.
- Next up: browser and e2e passes for every `[~]` row, then G2 to G8 in order.
- Branch: local `release/v1` from `main` at `8384bd1e`, created in W0.1. The orchestrator works on it in the main checkout. Worktrees are only for lane agents.
- A task's commit hash is filled in by the next commit, since a commit cannot contain its own hash.

Status marks: `[ ]` open, `[~] agent, date` in progress, `[x] hash` done. A task is done when its acceptance holds and `pnpm run check` exits 0.

## Open follow-ups

### Verification and data

- Browser run pending on every `[~]` row below. Mailpit pass pending on D2. E2E pending on D4 and D5.
- Rerun `pnpm run content:import --target local` (docs, FAQ, and the H1 role labels changed) and `pnpm run db:seed:demo --target local` (the detached-holder data changed). The staging demo seed has not run.

### Release and decisions

- G8 runbook: production has no database comment, lacks migrations 0013 to 0024 (includes 0023 `anonymize_deleted_holders` and 0024 `impersonated_by`), and holds 0 certificates.
- G6: run a `next build` check for the `checkRateLimit` fix (`await connection()`), which stopped the "unstable value `Date.now()` while prerendering" logs on `/verify`.
- G6 optional: an index on `activity_events (action, id)` would help `/admin/audit` once the table grows.
- qa1 browser check not covered: the "Get started" card (the seed checklist is complete) and the pending badge after an approval.
- `/admin/organizations` lists 4 pending fixtures that the overview counts as 0 and whose detail pages 404. The G1 reseed clears them.
- The Italian account-deletion prompt is served stale from dev server memory. A dev restart fixes it, not a code change.
- Decision: a private `/<username>` keeps status 200, because `notFound()` runs inside `Suspense` after streaming starts.
  - Next.js injects `noindex` there. A real 404 would need a database read in `proxy` on every request.
- Deferred after v1: split the mixed `Courses` and root `Certificates` namespaces by feature, and load locale catalogs per namespace so a client locale switch skips the server-only namespaces.
- `scripts/content/validate.test.ts` and `lib/email.test.ts` can time out when several worktrees run Vitest against the same clone.

### Content and legal

- E2 skill names and the 3 drafted definitions await GloRe review (O5).
- E5 legal texts keep `[... to be confirmed]` placeholders (U11). GloRe supplies the final texts.
  - Placeholders: contact, address, SMTP provider, legal bases, transfers, retention, DPO, liability, governing law, review time, charter breach.
- `/api/v1/ai/copilot` has no client in the app and never had one.
- Decision: `impersonatedBy` stays out of event metadata, because `recordEvent` is a transaction primitive with no request context.

## W0 foundations (orchestrator, sequential)

All done.

- W0.1 [x] 366ddc5e: cut `release/v1`, reused Docker Postgres and Mailpit, baseline recorded (`check` exit 0, `test` 17 of 17, `test:e2e` 11 of 11, recovery mail reached Mailpit).
- W0.2 [x] 2654156e: schema batch in 3 migrations with parsers, `src/db/schemas.ts`, relations, `CacheTag` entries. Migrates on `db:reset` and on current data.
- W0.3 [x] 82d1db3d: `recordEvent(tx, event)` and `notify(event)` with the typed catalog, recipients, locale, preference gating, in-app rows, and mail when a template exists.
- W0.4 [x] fde38ee1: `config/app.json` keys (`maxSkills` 4, `minActivityHours` 100, `minActivityMonths` 3, `invitationExpiryDays` 7, `reviewReminderDays` [3, 7], `maxBulkInvites` 50), `SKILL_LEVELS`, `fullName()`.
- W0.5 [x] b8d3e625: UI kit in `src/components/ui/`, AA contrast checked.
  - Parts: `ArrowsMotif`, `LevelDots`, `Timeline`, `DataTable`, `StatCard`, `Chart`, `CopyButton`, `QrCode`, `SegmentedControl`, `Banner`, `AvatarStack`, `--brand-quaternary`.
- W0.6 [x] (hash pending): `SEED_PASSWORD` is `Password1!`, `AUTH_ROLES` covers all seven seed roles, `db:seed:demo` scaffolded.
  - Neon `staging` was created from production and migrated (0013 to 0022 replayed in one transaction with Drizzle's journal rows).
  - The staging marker is the database comment `glore:staging`.
- W0.7 [x] 9c0895bb: `/api/auth/admin/*` answers 404 over HTTP, uploads check size before reading the body, the manifest reads `?locale=`, `react-email` is a dependency, `react-spring` stays (`globe.tsx`).
- W0.8 [x] 3f700472: `TEST_EMAIL` documented in `reference.md` (scripts only, outside the env schema).

## W1 feature lanes (parallel worktrees, all merged)

Run A, B, C, and E in parallel; start D when the first lane merges.

| Lane | Owns                                                                                                                                                                                                                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | `features/certificates/**`, `actions/certificates/**`, `db/mutations/certificate.ts`, `app/(dashboard)/certificates/**`, `app/[username]/**`, `app/verify/**`, certificate PDF assets.                                                                                                                                            |
| B    | `features/organization/**`, `features/admin/**`, `actions/organizations/**`, `actions/admin/**`, `db/mutations/organization.ts`, `app/(dashboard)/organization/**`, `app/(dashboard)/admin/**`, `app/(auth)/register/**`, `app/(auth)/invite/**`, `app/(auth)/join/**`, `api/v1/join/**`, the invitation pieces of `lib/auth.ts`. |
| C    | `features/courses/**`, `actions/courses/**`, `app/(dashboard)/courses/**`, `features/docs/**`, `app/(dashboard)/docs/**`.                                                                                                                                                                                                         |
| D    | `src/emails/**`, `lib/email.ts`, `features/users/**`, `features/onboarding/**`, `features/auth/**`, `features/notifications/**`, `app/(auth)/login/**`, `app/(auth)/onboarding/**`, `app/(dashboard)/settings/**`, `app/(dashboard)/notifications/**`, `api/v1/cron/**`, `app/privacy/**`, `app/terms/**`.                        |
| E    | `content/**` and `scripts/content/**` only; never `src/`.                                                                                                                                                                                                                                                                         |

### Lane A: certificates

- A1 [x] 44827a3b: lifecycle actions, each with an event and a notice. Tests for every transition and guard.
  - Actions: draft, submit, withdraw, claim, assign, reassign, unassign, self-assign, request changes, resubmit, reject, approve, revoke.
- A1b [x] d381e8e8: tutor load balancing by open requests, ties to the oldest last assignment. Authors never review themselves, the queue is scoped to the active org, and drafts have no assignment control.
- A2 [~] 6d6a8b75, lane-a, browser pending: wizard at `/certificates/new` (Experience, Skills, Your organization, Review), autosaving drafts, `?draft=` resume, resubmit mode, `EligibilityPanel`.
  - Accept: browser run of every step, draft resume, resubmit, and the blocked panel.
- A3 [~] 42233739, lane-a, browser pending: tutor workspace (queue tabs, filters, age badges) and `/certificates/[id]/review` with the approve PDF preview, request changes, and reject.
  - Accept: browser run of all three decisions, queue tabs, and filters.

#### Wallet, PDF, and verification

- A4 [~] aaa689dc, lane-a, browser pending: wallet and detail (cards, journey, timeline, comments, status-aware actions), share panel, featured certificate, one-time celebration.
  - Accept: browser run per status for volunteer, tutor, and manager.
- A5 [x] c164cb0b: PDF per `pdf.md`. G5 tightened the fidelity.
- A6 [~] e74024a5, lane-a, e2e not run by the lane: `/verify`, `/verify/[code]`, opt-in `/[username]`, legacy `?v=` redirect, 404 for private profiles.
  - Accept: e2e for valid, revoked, unknown, private (`e2e/verify.spec.ts` exists, and the later full suite with `--workers=2` passed 64).
- A7 [x] 10d1f167, lane-a, 2026-10-22: `OrganizationCertificates` component, mounted and checked by B6.

### Lane B: organizations, invitations, admin

- B1 [~] ddfa1997, browser pending: invitations (dialog, pending list, `/invite/[token]`, invite links, join request approval). Accept: tests for accept, decline, expiry, revoke, mismatch.
- B1b [x] e5c07a29: revoking an invite or removing a member kills its tokens, and approval and admin flows never link an existing account without consent.
- B2 [~] lane-b2, 2026-10-22, browser pending, 5dbd3e2b: members `DataTable`, drawer, role change, remove, leave, ownership transfer. Accept: browser run of each action.
- B3 [~] lane-b2, 2026-10-22, browser pending, 26887828: organization settings with signatory and danger zone. Accept: the signatory appears on a regenerated PDF.
- B4 [~] lane-b2, 2026-10-22, browser pending, 91b80945: overview with first-run checklist, insights tab, activity tab. Accept: browser run with demo data.
- B5 [~] lane-b2, 2026-10-22, browser pending, 49730187: `/register` application (D12), `/admin/organizations` queue and detail. Accept: e2e from application to onboarding.
- B6 [~] 3164658a, lane-b6, 2026-10-22, browser pending: `/admin/users`, `/admin/team`, `/admin/certificates`, `/admin/audit`, overview data. Accept: e2e for ban, impersonation, audit.
  - The `admin-users`, `admin-certificates`, and `admin-audit` `.spec.ts` files are written but not run.

### Lane C: learning

- C1 [~] lane-c, 2026-10-22, browser pending, 4865dc43: course overview with explicit Start or Resume. Accept: browser run as learner and volunteer.
- C2 [~] lane-c, 2026-10-22, browser pending, 910f6ed3: player with server-side grading, retries, final assessment. Accept: a test proves the payload has no `isCorrect`.
- C3 [~] lane-c, 2026-10-22, browser pending, 196cbd0f: completion screen with rating and next action. Accept: browser run.
- C4 [~] lane-c, 2026-10-22, e2e written not run, 9c6fd2f6: editor duration and outcomes, `/courses/skills` CRUD, translation coverage, preview, analytics. Accept: e2e for create, translate, publish.
- C5 [~] lane-c, 2026-10-22, browser pending, 7c45aa30: catalog cards, learner tabs, skill compass, recommendations. Accept: browser run.
- C6 [~] lane-c, 2026-10-22, browser pending, 61795946: docs empty states, article layout, search hook for the palette. Accept: browser run.

### Lane D: account, onboarding, notifications, emails

- D1 [~] lane-d, 2026-10-22, browser pending, a87c2cfa: notification bell and `/notifications`. Accept: e2e for read state.
- D2 [~] lane-d, 2026-10-22, Mailpit pass pending, 556d7148: email layout refresh and one template per catalog event. Accept: every template opened in Mailpit.
  - Also: subjects in all catalogs, localized role labels, and `pnpm run email` fixtures.
- D3 [x] 7d89d63a: daily cron with reminders, escalations, and pruning. Unit tests with a fixed clock.
- D4 [~] lane-d, 2026-10-22, browser and e2e pending, 6334653c: onboarding stepper and welcome. Accept: e2e from invitation to dashboard.
- D5 [~] lane-d, 2026-10-22, browser and e2e pending, 7a2175f9: settings tabs. Accept: e2e for privacy, export, sessions.
- D6 [~] lane-d, 2026-10-22, browser pending, 63c2fc0b: login by email or username, auth layout, PWA prompt, `/privacy` and `/terms`. Accept: browser run.

### Lane E: content

- E1 [x] 3198bcca: content format and importer (`content:import`, `content:check`, `--drafts`, `--target local, staging, production` with the host guard). Import is idempotent.
  - Format: `content/skill-groups.json`, `content/courses/<slug>/course.json`, and `lessons/<n>.<locale>.md`.
  - The importer upserts groups and courses by slug, converts Markdown with `@platejs/markdown`, and sets `languages`.
- E2 [~] 9e8c19ef, GloRe review of names and O5 definitions pending: the 25 skill courses in en, es, it. Accept: reviewed for tone, with the 3 drafted definitions listed for GloRe review (O5).
  - Work in batches of about 5 courses per agent session.
  - Lessons: Activation (volunteering scenario), Understanding (definition, components, examples).
  - Then In practice (situations plus 4 to 6 quiz questions with explanations), and Self-assessment (4 evaluations plus the final assessment).
- E3 [~] 981fb449, imported and browser check pending: 2 intro courses and 4 learner courses in three locales.
  - Intro: Welcome to GloRe; Soft skills and volunteering.
  - Learner: Volunteering abroad with ESC and Erasmus+; Intercultural learning; Volunteer wellbeing and safety; Planning a community project.

### Lane E: docs and legal

- E4 [~] lane-e4, 2026-10-22, browser pending, 5f5c5ee4 and 21597c68: docs in three locales (33 docs: Intro 4, Tutorials 7, FAQ 22). Accept: imported and rendered.
  - FAQ topics: cost, soft skills, activity rule, skills per certificate, certifying again, changed levels, non-member orgs.
- E5 [~] d3c58d95, placeholders await GloRe (U11): temporary privacy, terms, and Quality Charter in three locales (the H1 decision removed their temporary banners). Accept: rendered by D6 and the B5 charter step.

Content rules: plain, warm language for young adults, examples from volunteering, no invented statistics or citations.

## W2 experience integration (merged)

- F1 [~] lane-f1, 2026-10-22, browser pending, 05e86544: role dashboards on real data. Accept: browser run per role.
- F2 [~] lane-f2, 2026-10-22, browser pending, 4f45f1fa: shell (sidebar per role, bell, org switcher, command palette). Accept: browser run per role.
- F3 [~] lane-f3a/f3b/h2, 2026-10-22, browser pending, h2 514f40ba, 5927e36a, 45dfa4f6, a57aaade, dc78b017: visual and copy pass. Accept: screenshots reviewed.
  - Scope: UI direction, hardcoded strings from the inventory, dark mode, 390px layouts, and focus states.
  - Reviews: `web-design-guidelines` on every page, and `humanizer` on long copy.
- F4 [~] d830e29a, lane-f4, 2026-10-22, browser pending: `/admin` overview (D17 charts). Accept: browser run (merged and checked as admin at 1280px, 390px, and dark mode in 71fcff56).

## W3 verification and release readiness

- G1 [~] 6853647d, lane-g1, 2026-10-22, browser pending: full demo seed, local and staging, plus catalog import. Accept: `manual-testing.md` steps hold on both. Local browser check passed 6 of 8 flows.
- G2 [~] lane-g2, 2026-10-23: Playwright specs for every verification matrix row, plus es and it smoke tests. Accept: CI green.
- G3 [ ]: `agent-browser` pass for every matrix row at desktop and 390px, light and dark; fix and re-run until clean. Accept: screenshots reviewed, no open issues.
- G4 [ ]: trigger every email, open it in Mailpit, follow its links. Accept: all links resolve.
- G5 [~] c5cd51bd, lane-g5, 2026-10-23: PDF fidelity check from `pdf.md`. Accept: passes.

### Hardening and handoff

- G6 [ ]: `pnpm run build`, `pnpm run analyze`, `code-reviewer` over the full diff (two rounds max), `security-review`, rate limits on every public action. Accept: no unresolved high findings.
- G7 [ ]: docs sync of `AGENTS.md`, `README.md`, `app.md`, `reference.md`, `patterns.md`, `architecture.md`, `manual-testing.md`; drop `certificates.handle` once redirects are verified. Accept: docs match code.
- G8 [ ]: handoff with the commit list, staging push on request, production steps (backup, migrate, catalog as drafts, env, deploy), and known gaps. Accept: the user has a numbered runbook.

### Product owner and fix lanes

- H1 [~] lane-h1, 2026-10-22, browser pending: product owner decisions U12 to U17.
  - Done: legal banners removed (d8316b59), org role `admin` labeled Owner (2fa57f6d), es login title (d024b43f), issued certificates survive account deletion (381d31b9).
  - Accept: browser run per item.
- H3 [~] lane-h3, 2026-10-22, browser pending: stock Better Auth impersonation replaces the local plugin (migration 0024, 45f69dae). Accept: `/admin/users` view-as, banner, stop.
- H4 [~] lane-h4, 2026-10-22, browser pending: editor AI on the free Gemini tier with a model chain and first-token fallback (1846977d). Accept: browser run of the AI menu in it.
- H5 [~] lane-h5, 2026-10-22, browser pending: browser-check fixes for titles, headings, `aria-controls`, and chip names (7efbd47a, 8f9b5bd9). Accept: browser run per item.

## Verification matrix

Each row runs in the browser as the demo account from `manual-testing.md` and has a Playwright spec from G2.

| Role             | Flows                                                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public           | Login by email and username, password reset, org application, verify by code, revoked certificate, opt-in profile, private profile 404, privacy and terms.                                           |
| Invitee          | Accept as a new account and onboard, accept as an existing account, decline, expired link, revoked link, invite link with approval.                                                                  |
| Volunteer        | Onboarding, compass, overview, quiz retry, reflection, completion and rating, eligibility, wizard with draft, submit, withdraw, resubmit, approval celebration, PDF, share, featured, notifications. |
| Learner          | No skill courses, completion, rating, my learning, no certificates area.                                                                                                                             |
| Tutor            | Queue, claim, level changes, request changes, reject, approve with preview, reminders, reassign.                                                                                                     |
| Representative   | Single and bulk invite, revoke, invite link, approve join request, remove volunteer, reassign tutor, pipeline, insights; cannot delete the org or change roles.                                      |
| Org owner        | Representative flows plus role change, signatory, logo, ownership transfer, revoke a certificate, delete an org without certificates.                                                                |
| Multi-org member | Switch org, different role per org, leave an org.                                                                                                                                                    |
| Editor           | Create course, lessons and quiz, translate, publish per language, framework, preview as learner, analytics; no org interface.                                                                        |
| Platform admin   | Overview, approve and reject applications, org detail, ban with expiry, unban, impersonate and stop, team, certificate lookup and revoke, audit log.                                                 |
| Every role       | es and it, dark mode, 390px, command palette, notification center, settings tabs, data export.                                                                                                       |
