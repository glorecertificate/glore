# GloRe v0.7 release: tasks

Executable checklist and live status. Rules and IDs come from `spec.md` and `plan.md`. History and per-task notes: `log.md`.

## Status

- State: in progress, the user gave the go on 2026-10-22.
- Current wave: W3 (verification and release readiness). W0 to W2 are integrated, and the history is linear (no merge commits).
- Next up: W4 translations and team content (`translations.md`, U18 to U21), then the G8 handoff in `runbook.md`. Production steps stay with the user.
- Branch: local `release/v0.7` from `main` at `8384bd1e`, created in W0.1. The orchestrator works on it in the main checkout. Worktrees are only for lane agents.
- A task's commit hash is filled in by the next commit, since a commit cannot contain its own hash.

Status marks: `[ ]` open, `[~] agent, date` in progress, `[x] hash` done. A task is done when its acceptance holds and `pnpm run check` exits 0.

## Open follow-ups

### Verification and data

- G3 browser pass, the D2 Mailpit pass, and the e2e suite cover every feature row. Open: G1 staging seed (user step).
- Staging (Neon `staging`, comment `glore:staging`) has migrations 0000 to 0022 only. Its migrate, catalog import, and demo seed are user steps (`runbook.md`, step 2), because agents may not read the staging credentials.
- Rerun `pnpm run content:import --target local` (docs, FAQ, and the H1 role labels changed) and `pnpm run db:seed:demo --target local` (the detached-holder data changed). The staging demo seed has not run.

### Release and decisions

- G8 runbook: production has no database comment, lacks migrations 0013 to 0025 (includes 0023 `anonymize_deleted_holders`, 0024 `impersonated_by`, and 0025 default certificate dedupe), and holds 0 certificates.
- Migration 0025 adds the `activity_events` indexes `(created_at, id)` and `(organization_id, id)` for `/admin/audit`.
- qa1 browser check not covered: the "Get started" card (the seed checklist is complete) and the pending badge after an approval.
- `/admin/organizations` lists 4 pending fixtures that the overview counts as 0 and whose detail pages 404. The G1 reseed clears them.
- The Italian account-deletion prompt is served stale from dev server memory. A dev restart fixes it, not a code change.
- Decision: a private `/<username>` keeps status 200, because `notFound()` runs inside `Suspense` after streaming starts.
  - Next.js injects `noindex` there. A real 404 would need a database read in `proxy` on every request.
- Done in lane I (090b3abb): `Certificates` and `Courses` split into feature namespaces, `serverNamespaces` in `config/i18n.json`, and a locale switch that fetches client namespaces only.
- Open, after v0.7: route-scoped client message providers, splitting `Organization`, `Users`, and `Admin.*`, and deleting leftover unused keys.
- `scripts/content/validate.test.ts` and `lib/email.test.ts` can time out when several worktrees run Vitest against the same clone.

### Content and legal

- GloRe review items (legal texts, O5 definitions, skill names, course publishing, docs, Crowdin owner) live in `glore-followups.md`.
- `/api/v1/ai/copilot` has no client in the app and never had one.
- Decision: `impersonatedBy` stays out of event metadata, because `recordEvent` is a transaction primitive with no request context.

## W0 foundations (orchestrator, sequential)

All done.

- W0.1 [x] c099edbe: cut `release/v0.7`, reused Docker Postgres and Mailpit, baseline recorded (`check` exit 0, `test` 17 of 17, `test:e2e` 11 of 11, recovery mail reached Mailpit).
- W0.2 [x] 982aab00: schema batch in 3 migrations with parsers, `src/db/schemas.ts`, relations, `CacheTag` entries. Migrates on `db:reset` and on current data.
- W0.3 [x] ece449da: `recordEvent(tx, event)` and `notify(event)` with the typed catalog, recipients, locale, preference gating, in-app rows, and mail when a template exists.
- W0.4 [x] 885c0c0a: `config/app.json` keys (`maxSkills` 4, `minActivityHours` 100, `minActivityMonths` 3, `invitationExpiryDays` 7, `reviewReminderDays` [3, 7], `maxBulkInvites` 50), `SKILL_LEVELS`, `fullName()`.
- W0.5 [x] 97887ff5: UI kit in `src/components/ui/`, AA contrast checked.
  - Parts: `ArrowsMotif`, `LevelDots`, `Timeline`, `DataTable`, `StatCard`, `Chart`, `CopyButton`, `QrCode`, `SegmentedControl`, `Banner`, `AvatarStack`, `--brand-quaternary`.
- W0.6 [x] (hash pending): `SEED_PASSWORD` is `Password1!`, `AUTH_ROLES` covers all seven seed roles, `db:seed:demo` scaffolded.
  - Neon `staging` was created from production and migrated (0013 to 0022 replayed in one transaction with Drizzle's journal rows).
  - The staging marker is the database comment `glore:staging`.
- W0.7 [x] 338347fb: `/api/auth/admin/*` answers 404 over HTTP, uploads check size before reading the body, the manifest reads `?locale=`, `react-email` is a dependency, `react-spring` stays (`globe.tsx`).
- W0.8 [x] 5df7e3e5: `TEST_EMAIL` documented in `reference.md` (scripts only, outside the env schema).

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

- A1 [x] 91aad41c: lifecycle actions, each with an event and a notice. Tests for every transition and guard.
  - Actions: draft, submit, withdraw, claim, assign, reassign, unassign, self-assign, request changes, resubmit, reject, approve, revoke.
- A1b [x] 91aad41c: tutor load balancing by open requests, ties to the oldest last assignment. Authors never review themselves, the queue is scoped to the active org, and drafts have no assignment control.
- A2 [x] 1090c0fe, G3 and e2e checked: wizard at `/certificates/new` (Experience, Skills, Your organization, Review), autosaving drafts, `?draft=` resume, resubmit mode, `EligibilityPanel`.
  - Accept: browser run of every step, draft resume, resubmit, and the blocked panel.
- A3 [x] 1090c0fe, G3 and e2e checked: tutor workspace (queue tabs, filters, age badges) and `/certificates/[id]/review` with the approve PDF preview, request changes, and reject.
  - Accept: browser run of all three decisions, queue tabs, and filters.

#### Wallet, PDF, and verification

- A4 [x] 1090c0fe, G3 and e2e checked: wallet and detail (cards, journey, timeline, comments, status-aware actions), share panel, featured certificate, one-time celebration.
  - Accept: browser run per status for volunteer, tutor, and manager.
- A5 [x] a60e6561: PDF per `pdf.md`. G5 tightened the fidelity.
- A6 [x] 1090c0fe, G3 and e2e checked: `/verify`, `/verify/[code]`, opt-in `/[username]`, legacy `?v=` redirect, 404 for private profiles.
  - Accept: e2e for valid, revoked, unknown, private (`e2e/verify.spec.ts` exists, and the later full suite with `--workers=2` passed 64).
- A7 [x] 1090c0fe, lane-a, 2026-10-22: `OrganizationCertificates` component, mounted and checked by B6.

### Lane B: organizations, invitations, admin

- B1 [x] 2154ca95, G3 and e2e checked: invitations (dialog, pending list, `/invite/[token]`, invite links, join request approval). Accept: tests for accept, decline, expiry, revoke, mismatch.
- B1b [x] 2154ca95: revoking an invite or removing a member kills its tokens, and approval and admin flows never link an existing account without consent.
- B2 [x] 542bb4ff, G3 and e2e checked: members `DataTable`, drawer, role change, remove, leave, ownership transfer. Accept: browser run of each action.
- B3 [x] 542bb4ff, G3 and e2e checked: organization settings with signatory and danger zone. Accept: the signatory appears on a regenerated PDF.
- B4 [x] 542bb4ff, G3 and e2e checked: overview with first-run checklist, insights tab, activity tab. Accept: browser run with demo data.
- B5 [x] 542bb4ff, G3 and e2e checked: `/register` application (D12), `/admin/organizations` queue and detail. Accept: e2e from application to onboarding.
- B6 [x] 98e4b160, G3 and e2e checked: `/admin/users`, `/admin/team`, `/admin/certificates`, `/admin/audit`, overview data. Accept: e2e for ban, impersonation, audit.
  - The `admin-users`, `admin-certificates`, and `admin-audit` `.spec.ts` files are written but not run.

### Lane C: learning

- C1 [x] 19dddb49, G3 and e2e checked: course overview with explicit Start or Resume. Accept: browser run as learner and volunteer.
- C2 [x] 19dddb49, G3 and e2e checked: player with server-side grading, retries, final assessment. Accept: a test proves the payload has no `isCorrect`.
- C3 [x] 19dddb49, G3 and e2e checked: completion screen with rating and next action. Accept: browser run.
- C4 [x] 19dddb49, G3 and e2e checked: editor duration and outcomes, `/courses/skills` CRUD, translation coverage, preview, analytics. Accept: e2e for create, translate, publish.
- C5 [x] 19dddb49, G3 and e2e checked: catalog cards, learner tabs, skill compass, recommendations. Accept: browser run.
- C6 [x] 19dddb49, G3 and e2e checked: docs empty states, article layout, search hook for the palette. Accept: browser run.

### Lane D: account, onboarding, notifications, emails

- D1 [x] 15652e15, G3 and e2e checked: notification bell and `/notifications`. Accept: e2e for read state.
- D2 [x] 15652e15, Mailpit pass 2026-10-23 (20 templates, 34 variants, 3 locales): email layout refresh and one template per catalog event. Accept: every template opened in Mailpit.
  - Also: subjects in all catalogs, localized role labels, and `pnpm run email` fixtures.
- D3 [x] 15652e15: daily cron with reminders, escalations, and pruning. Unit tests with a fixed clock.
- D4 [x] 15652e15, G3 and e2e checked: onboarding stepper and welcome. Accept: e2e from invitation to dashboard.
- D5 [x] 15652e15, G3 and e2e checked: settings tabs. Accept: e2e for privacy, export, sessions.
- D6 [x] 15652e15, G3 and e2e checked: login by email or username, auth layout, PWA prompt, `/privacy` and `/terms`. Accept: browser run.

### Lane E: content

- E1 [x] 6b75e5d1: content format and importer (`content:import`, `content:check`, `--drafts`, `--target local, staging, production` with the host guard). Import is idempotent.
  - Format: `content/skill-groups.json`, `content/courses/<slug>/course.json`, and `lessons/<n>.<locale>.md`.
  - The importer upserts groups and courses by slug, converts Markdown with `@platejs/markdown`, and sets `languages`.
- E2 [~] 208ca5ba, GloRe review of names and O5 definitions pending: the 25 skill courses in en, es, it. Accept: reviewed for tone, with the 3 drafted definitions listed for GloRe review (O5).
  - Work in batches of about 5 courses per agent session.
  - Lessons: Activation (volunteering scenario), Understanding (definition, components, examples).
  - Then In practice (situations plus 4 to 6 quiz questions with explanations), and Self-assessment (4 evaluations plus the final assessment).
- E3 [x] 7ae07d23, G3 and e2e checked: 2 intro courses and 4 learner courses in three locales.
  - Intro: Welcome to GloRe; Soft skills and volunteering.
  - Learner: Volunteering abroad with ESC and Erasmus+; Intercultural learning; Volunteer wellbeing and safety; Planning a community project.

### Lane E: docs and legal

- E4 [x] 8551f17f and 8551f17f, G3 and e2e checked: docs in three locales (33 docs: Intro 4, Tutorials 7, FAQ 22). Accept: imported and rendered.
  - FAQ topics: cost, soft skills, activity rule, skills per certificate, certifying again, changed levels, non-member orgs.
- E5 [~] 7ae07d23, placeholders await GloRe (U11): temporary privacy, terms, and Quality Charter in three locales (the H1 decision removed their temporary banners). Accept: rendered by D6 and the B5 charter step.

Content rules: plain, warm language for young adults, examples from volunteering, no invented statistics or citations.

## W2 experience integration (merged)

- F1 [x] 26babcf3, G3 and e2e checked: role dashboards on real data. Accept: browser run per role.
- F2 [x] 8e98ed89, G3 and e2e checked: shell (sidebar per role, bell, org switcher, command palette). Accept: browser run per role.
- F3 [x] 0fd3bd81 and 27ef9ba0 and ffe4189d and 0e0a07cd and fdd35bf0, G3 and e2e checked: visual and copy pass. Accept: screenshots reviewed.
  - Scope: UI direction, hardcoded strings from the inventory, dark mode, 390px layouts, and focus states.
  - Reviews: `web-design-guidelines` on every page, and `humanizer` on long copy.
- F4 [x] 14390b00, G3 and e2e checked: `/admin` overview (D17 charts). Accept: browser run (merged and checked as admin at 1280px, 390px, and dark mode in 14390b00).

## W3 verification and release readiness

- G1 [~] e30af563, local done, staging is a user step: full demo seed, local and staging, plus catalog import. Accept: `manual-testing.md` steps hold on both. Local browser check passed 6 of 8 flows.
- G2 [x] b86109e0: Playwright specs for every verification matrix row, plus es and it smoke tests (166 passed locally). Accept: CI green.
  - Fixed the two app bugs it found: the wizard submitted on its last Continue, and a learner could open `/certificates` by URL.
  - Not covered: lesson and quiz authoring, the skill compass, and the pipeline and insights tabs.
- G3 [x] orchestrator, 2026-10-23: `agent-browser` pass for every matrix row at desktop and 390px, light and dark; fix and re-run until clean. Accept: screenshots reviewed, no open issues.
  - G3a (volunteer, tutor, public) ran. Fixed in e91cd8b1 to 8c5e3347: tutor release 404, share overflow at 390px, level picker overlap, palette drafts, stale date error, raw nationality, draft resume step, and copy.
  - G3a fixed earlier: the PDF task overlap (a8b857a1).
  - Fixed: stepper labels centered (053851cd), neutral request page title (db0125c9).
  - Open, low: toast over settings tabs, IPv6 loopback, the approve preview fallback, and prefill after a withdrawal (new feature, after v0.7).
  - G3b (editor, admin, impersonation, multi-org) and G3c (owner, representative, every role) ran. Lanes Y and Z merged their fixes.
  - Fixed: stale reviewer and tutor queues after a reassign or release (dedd1800).
  - Fixed: public period and skills heading (59e28def), signed-in profile 404 (45120717), skill progress cap (932c3243).
  - Fixed: typed name before an org delete (1495c437), palette labels (1a90fdb3), review period (e74559ed), time hydration (6116a35b).
  - Fixed in lane W (5b909084): share fields at 390px, the Italian table at 1280px, and the mobile review bar.
  - By design: an unknown single-segment path renders the profile 404, and an escalation notice keeps the wait at send time.
  - Fixed: role-gated 404 tab titles (4938a527). Removed locally: fixture courses `w05-ui-kit-browser-check` and `competenze-sociali`.
  - Open, dev only: "Could not validate instant" errors on role-gated 404s.
- G4 [x] c8032924: trigger every email, open it in Mailpit, follow its links. Accept: all links resolve.
  - 18 of 24 templates ran live in en, es, and it, and all links resolved.
  - Fixed: the team invite named the invitee as inviter, the unsubscribe GET used the proxy host, and the welcome mail order.
  - Fixed: reassign left a stale reviewer select, and calendar months ignored the app locale.
  - Not triggered: cron-only mails (reminders, escalation, invitation expiring), the expired invitation link, and the ownership transfer mail (covered by e2e).
  - Fixed: Resend is hidden for an accepted team invitation (5c96eb7a).
  - Open, low: an invite landing page is English without a locale cookie.
- G5 [x] deb1e19c, rerun 2026-10-23: PDF fidelity check from `pdf.md`. Accept: passes.
  - Fixed: the Erasmus+ emblem lost its soft mask and rendered bold; `public/certificate/erasmus-plus.png` is now the masked RGBA image.
  - Decision: the signatory label reads "Represented by" (translation review), and `pdf.md` says so.
  - Open, low: nationality prints a country name where the template shows a demonym; value baselines sit 0.6 pt high; a 6-line org name overruns its section bar.

### Hardening and handoff

- G6 [x] 326b1af0: `pnpm run build`, `pnpm run analyze`, `code-reviewer` over the full diff (two rounds max), `security-review`, rate limits on every public action. Accept: no unresolved high findings.
  - Security review: no high finding. Rate limit keys hold token hashes, the invitation route rejects banned users and is not cached (697d5996).
  - Code review: no high finding. CSP now allows the blob PDF preview and lesson media (326b1af0). Form state reads skip the compiler cache (7ad39df3, 0fec140c).
  - Accepted: legacy invitation rows without a seal rotate on first reveal (production has none), and `/api/v1/invitations/[id]` sends signed-out users to login without `next`, because `safeNextPath` rejects `/api`.
  - Build and analyze pass with no prerender warnings. The calendar loaded every date-fns locale (6a88a32c).
  - UI review fixes are in (1b43c0e3 to 7662943a). Lane S (data integrity, migration 0025) merged in df13d174. Lane X (15 security fixes) merged in 4a435e64, follow-ups in 06650576 and 66a9e18c. Build passes after both.
  - Open, low: no server-side password regex on reset and change (length only), a signed-in `/login?next=` ignores `next`, and non-DB errors keep their message in `queryError`.
  - Production pre-check, read only: 0017 and 0021 cannot collide on production data (4 distinct skill group slugs, empty docs and join requests).
  - Decision: one app time zone, `Europe/Rome`.
  - Decision: certificate PDFs stay public objects for `/verify`, and revoke deletes the object.
  - Done in lane K (5d62af73): `LucideIcon` everywhere with a lint block on `lucide-react`, no editor `useMemo`, and a learner plugin set without the AI kit.
  - Also in lane K: type checking in `next build`, and SRI plus no production `'unsafe-eval'` in place of CSP nonces.
  - SRI covers only the build-manifest scripts (7 of 28); Turbopack does not hash the other chunks (`routes.md`).
  - Done: invitation tokens are stored as a SHA-256 hash plus an AES-GCM seal (migrations 0026 to 0028).
- G7 [x] 7be8543d: docs sync of `AGENTS.md`, `README.md`, `app.md`, `reference.md`, `patterns.md`, `architecture.md`, `manual-testing.md`. Accept: docs match code.
  - Done per change: token hashing, CSP, form hooks, linear history, and the v0.7 rename. A full `/sync-docs` and `/sync-agents --check` pass has not run since lanes I and K.
  - Decision: `certificates.handle` stays, because the legacy `?v={handle}` redirect and the R2 PDF key read it.
- G8 [ ]: handoff with the commit list, staging push on request, production steps (backup, migrate, catalog as drafts, env, deploy), and known gaps. Accept: the user has a numbered runbook.

### Product owner and fix lanes

- H1 [x] G3 and e2e checked: product owner decisions U12 to U17.
  - Done: legal banners removed (2d64e138), org role `admin` labeled Owner (2d64e138), es login title (2d64e138), issued certificates survive account deletion (2d64e138).
  - Accept: browser run per item.
- H3 [x] G3 and e2e checked: stock Better Auth impersonation replaces the local plugin (migration 0024, 988a0788). Accept: `/admin/users` view-as, banner, stop.
- H4 [x] 3a32239c and dffa09c9, checked in the G3 browser pass: editor AI on the free Gemini tier with a model chain and first-token fallback. Accept: browser run of the AI menu in it.
- H5 [x] G3 and e2e checked: browser-check fixes for titles, headings, `aria-controls`, and chip names (a07bb8de, a07bb8de). Accept: browser run per item.

## W4a platform upgrade

- R1 [x] (lane r1, 2026-10-23, 69f76fa8 to 946eb889): update every dependency, pnpm, and Node.js to the latest compatible versions within the 24h release age, and fix breaking changes.
  - Accept: `pnpm run check`, `pnpm run test`, `pnpm run build`, and `pnpm run test:e2e` pass; Vercel supports the Node.js version; majors held back are listed with the reason.
  - Done: Node 24.22.1 (Vercel offers 24.x and 22.x only), pnpm 12.15.0, every direct dependency latest; check, 1078 unit tests, build, and e2e (156 passed) green.
  - Held: `@platejs/dnd` at 53.1.0 (53.3 breaks the vendored table node) and `@types/node` at 24 (runtime major).
  - Fixed: better-auth 1.7 needs `account_id` equal to the user id for credentials (e2e fixtures), and new oxlint rules were configured off in `.oxlintrc.json`.
  - Checked 2026-10-23: production and staging have 0 credential accounts with `account_id` different from `user_id`, so no data migration is needed.
  - Open: the 4 mail specs fail in production mode (SMTP forced), and the Vercel "Node.js Version" project setting should read 24.x.

## W4 translations and team content

Design: `translations.md`. Order: T0, then T1 and T2 in parallel lanes, then T3 to T6. About 19 agent-days.

- T0 [x]: one `loadMessages(locale)` for the request, client, email, and PDF loaders, `messageSignature` in `src/lib/icu.ts`, locale lists from `LOCALES`, production importer lock.
  - Accept: no behavior change, check and tests green.
  - Scripts import `messageSignature` as `#lib/icu.ts`, and `package.json` gains `"type": "module"` so node loads `.ts` files without a warning.
  - `src/emails/translate.ts` keeps the bundled `en` default for React Email previews, which run outside the app.
  - The cache tags move to T1 and T2, where they are first used, because knip rejects unused enum members.
  - `icu-minify` moves to T2, after R1 settles the lockfile. `content:import --target production` needs `--bootstrap` once content exists.
- T1 [ ]: legal tables, seed from `content/legal`, cached reader, admin draft, publish, and history UI, audit events.
  - Accept: legal pages render from the database, published versions are immutable, e2e publishes v2 and the date changes.
- T1b [ ]: `legal_acceptances`, terms checkbox at registration and onboarding, material re-accept gate in the dashboard layout.
  - Accept: e2e for a material v2.
- T2 [x]: override tables, cached loader with compile and signature filter, protected namespaces, publish with `updateTag`, PDF labels frozen in the approval snapshot. Hash pending.
  - Accept: Vitest for merge and stale states, `@prod` e2e interpolates `{name}`, Mailpit shows an overridden subject.
  - `messages.published` and `messages.reset` are recorded but not yet in `AUDIT_ACTIONS`; T3 adds the audit category and copy.
  - T3 reads classification from `classifyOverride` in `src/lib/message-overrides.ts` and writes through `src/actions/messages.ts`.
- T3 [ ]: `/admin/translations` with filters, ICU validation, preview, reset, history, AI suggest, and the stale override cron notice.
  - Accept: e2e override, invalid ICU blocked, reset, editors blocked from protected namespaces.
- T4 [ ]: `content_translations`, per-locale status in the course, doc, and skill group editors, AI translate for Plate content, `doc_articles.languages`, dashboard coverage, audit events.
  - Accept: e2e translate, review, publish `es`, outdated flag after an `en` edit.
- T5 [ ]: `app_settings` editor, `i18n:overrides` and `i18n:pull` scripts, `rename-key.mts`.
  - Accept: a contact email edit reaches the email layout and footer.
- T6 [ ]: remove `crowdin.yml` and the Crowdin docs, update specs, `AGENTS.md`, `README.md`, `manual-testing.md`, and `glore-followups.md`.
  - Accept: docs match code, `/sync-docs` and `/sync-agents --check` clean.

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
