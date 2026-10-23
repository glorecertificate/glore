# GloRe v0.7 release: plan

Architecture, sequence, and working protocol for v0.7. Decisions with IDs (U1, D3) live in `spec.md`; the checklist lives in `tasks.md`.

W4 (translations and team content) has its own design in `translations.md`.

## Environments

| Environment | URL                              | Database                                             | Email                                          |
| ----------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Local       | `https://glore.localhost`        | Docker Postgres on 5433 (`pnpm run db:up`)           | Mailpit (`pnpm run mail:up`, `localhost:8025`) |
| Staging     | Vercel preview of git `staging`  | Neon branch `staging` in project `old-base-10661180` | Real SMTP to `TEST_EMAIL` plus-addresses       |
| Production  | `elearning.glorecertificate.net` | Neon branch `production`                             | Real SMTP                                      |

- Local mail reaches Mailpit through `MAIL_TRANSPORT=mailpit` in `.env.local`, which the user confirmed on 2026-10-22.
- W0.1 still proves delivery with `pnpm run test:e2e -- e2e/recovery.spec.ts`; if no mail arrives, stop and ask the user (agents cannot read env files).
- Demo accounts are `<local>+glore-<key>@<domain>` from `TEST_EMAIL`, password `Password1!`, listed in `.agents/references/manual-testing.md`.
- Seeding staging passes `TEST_EMAIL` to the script at runtime; never write the address into a file.
- No workflow migrates production. Production migration and catalog import are user-approved steps in W3.
- Staging needs branch-scoped Vercel preview env vars (`DATABASE_URL`, `APP_URL`) for git branch `staging`; the user sets them.

## Data model changes (W0.2, one batch)

Generate with `pnpm run db generate`, apply with `pnpm run db migrate`, never hand-edit `drizzle/`. Order: additive changes, then data moves, then drops.

| #   | Target                       | Change                                                                                                                                                                                                                  |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `certificate_status` enum    | Add `rejected`, `withdrawn`, `revoked`.                                                                                                                                                                                 |
| 2   | `users`                      | Add `nationality` (ISO alpha-2), `birth_place`, `public_profile` (default false), `notification_preferences` (jsonb, default `{}`).                                                                                     |
| 3   | `organization_profiles`      | Add `legal_name`, `registry_id`, `legal_representative`, `signature_url`, `contact_name`, `contact_email`, `volunteers_per_year`, `motivation`, `charter_accepted_at`.                                                  |
| 4   | `organization_invitations`   | New: org FK cascade, email, role, unique token, `invited_by_id` and `user_id` (set null), locale, message, `expires_at`, `accepted_at`, `revoked_at`, `last_sent_at`. Partial unique on (org, lower(email)) while open. |
| 5   | `organization_invite_links`  | New: org FK cascade, role (`volunteer` or `learner`), unique token, `requires_approval`, `max_uses`, `uses`, `expires_at`, `revoked_at`, `created_by_id`.                                                               |
| 6   | `organization_join_requests` | Add `user_id` (cascade, nullable) and `invite_link_id` (set null). Partial unique on (org, lower(email)) while `pending`.                                                                                               |
| 7   | `certificates`               | Add `code` (unique, backfilled), `tasks` (text[]), `submitted_at`, `reviewed_at`, `rejected_reason`, `revoked_at`, `revoked_by_id`, `revoked_reason`, `withdrawn_at`, `snapshot` (jsonb written at approval).           |
| 8   | `certificates` cleanup       | Move `organization_rating` into `organization_ratings`, then drop it. Keep `handle`: the legacy `?v={handle}` redirect and the R2 PDF key read it.                                                                      |
| 9   | `certificate_skills`         | Add `self_level`, `level` (1 to 5), `evidence`, `statement`, `sort_order`; unique (certificate_id, course_id).                                                                                                          |
| 10  | `certificate_reviews`        | New: certificate FK cascade, reviewer (set null), decision (`approved`, `changes_requested`, `rejected`), comment, `section_comments` (jsonb), four blind scores 1 to 5 (approve only), `created_at`.                   |
| 11  | `organization_ratings`       | New: certificate (unique, cascade), org (cascade), `experience`, `support`, `certification_support` (1 to 5), `would_recommend`, comment (up to 400 characters, as on the old platform).                                |
| 12  | `activity_events`            | New: actor and org (set null), `subject_type`, `subject_id`, `action`, `metadata` (jsonb), `created_at`. Indexes on (subject, created_at) and (org, created_at).                                                        |
| 13  | `notifications`              | New: user (cascade), `type`, `data` (jsonb), `url`, `read_at`, `emailed_at`, `created_at`. Index on (user, read_at, created_at).                                                                                        |
| 14  | `course_ratings`             | New: user, course, rating 1 to 5, comment, timestamps; unique (user, course).                                                                                                                                           |
| 15  | `courses`, `skill_groups`    | Courses add `duration_minutes` and `outcomes` (intl list). Skill groups add `description` (intl), `icon`, `sort_order`, timestamps.                                                                                     |
| 16  | Progress tables              | `user_assessments` adds `reflection`. `user_courses` adds `last_lesson_id` (set null) and `completed_at`. New `user_skill_compass` (user, course, kind `strength` or `goal`, unique triple).                            |
| 17  | Hygiene                      | Unique doc slugs. Drop the redundant index on `organization_profiles.organization_id`. `courses.creator_id` and `team_invitations.invited_by` become nullable with `on delete set null`.                                |

### Batch notes (W0.2)

- Migrations: `0017_v1_additive`, `0018_v1_backfill` (custom: codes, ratings), `0019_v1_drops`.
- `certificates.code` is nullable and unique: the backfill gives every existing row a code, and A1 sets it at submit.
- `organization_invitations` adds `declined_at` for B1's decline; "open" means not accepted, declined, or revoked.
- The four blind scores are `score_engagement`, `score_evidence`, `score_reflection`, `score_growth`; A3 owns their labels.
- `certificate_skills.certificate_id` now cascades on delete, so deleting a draft or account needs no manual skill cleanup.
- The old single org rating moved to `organization_ratings.experience`; the PDF no longer prints it (D9).
- `skill_groups.slug` (`0020` to `0022`) is the importer's upsert key; the old "Work" row became `work-skills`.
- knip fails on unused exports, so zod schemas, parsers, and `CacheTag` entries for new tables land with their first consumer.

### Schema requests

Lanes never change the schema. They append a request here (date, lane, change, reason) and the orchestrator batches it.

- None yet.

## Routes after v0.7

| Area           | Routes                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public         | `/login`, `/register` (application), `/invite/[token]`, `/join/[token]` (invite link), `/verify`, `/verify/[code]`, `/[username]` (opt-in), `/privacy`, `/terms`, `/offline`. |
| Learning       | `/courses`, `/courses/[slug]` (overview for members, editor for editors), `/courses/[slug]/learn?lesson=`, `/courses/skills` (framework, editors).                            |
| Certificates   | `/certificates` (wallet or tutor queue), `/certificates/new?draft=`, `/certificates/[id]` (detail and timeline), `/certificates/[id]/review` (tutor).                         |
| Organization   | `/organization?tab=` overview, members, invitations, requests, certificates, insights, activity, settings.                                                                    |
| Account        | `/dashboard`, `/notifications`, `/settings?tab=` profile, account, privacy, notifications, security, data; `/docs` (intro, tutorials, faq), `/help`, `/about`.                |
| Platform admin | `/admin` (overview, replaces the `next.config.ts` redirect), `/admin/organizations` and `[id]`, `/admin/users`, `/admin/team`, `/admin/certificates`, `/admin/audit`.         |

Reserve every top-level segment of `src/app` (and `verify`, `invite`, `join`, `privacy`, `terms`) as forbidden usernames.

## Event catalog

Every event writes an `activity_events` row through `recordEvent`, then `notify` fans out. M is mandatory mail; O is an optional category the user can turn off.

| Event                                  | In-app                        | Email                                          |
| -------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `certificate.submitted`                | assigned tutor or tutor pool  | tutor (M)                                      |
| `certificate.assigned`                 | new and previous tutor        | new tutor (M)                                  |
| `certificate.claimed`                  | volunteer                     | none                                           |
| `certificate.changes_requested`        | volunteer                     | volunteer (M)                                  |
| `certificate.resubmitted`              | tutor                         | tutor (M)                                      |
| `certificate.approved`                 | volunteer, org managers       | volunteer (M) with the PDF link                |
| `certificate.rejected`, `.revoked`     | volunteer                     | volunteer (M)                                  |
| `certificate.withdrawn`                | tutor                         | none                                           |
| `certificate.review_reminder`          | tutor                         | tutor (O reminders), days 3 and 7              |
| `certificate.review_escalated`         | org owner and representatives | org managers (O reminders), after day 7        |
| `learning.eligible`                    | volunteer                     | volunteer (O learning), first time only        |
| `course.completed`                     | learner or volunteer          | none                                           |
| `organization.application_received`    | platform admins               | applicant (M), platform admins (M)             |
| `organization.application_decided`     | none                          | applicant (M), approval carries the invitation |
| `invitation.sent`                      | existing invitee              | invitee (M)                                    |
| `invitation.accepted`                  | inviter                       | none                                           |
| `invitation.expiring`                  | none                          | invitee (O reminders), day 5                   |
| `join_request.created`                 | org managers                  | org managers (O organization)                  |
| `join_request.decided`                 | requester                     | requester (M)                                  |
| `member.role_changed`                  | member                        | member (M)                                     |
| `member.removed`                       | none                          | member (M)                                     |
| `member.left`                          | org managers                  | none                                           |
| `organization.ownership_transferred`   | old and new owner             | old and new owner (M)                          |
| `team.invited`, `team.role_changed`    | member                        | invitee (M)                                    |
| `account.welcome`                      | none                          | user (M), shows the username                   |
| `account.suspended`, `account.deleted` | none                          | user (M)                                       |

Existing auth mails keep their triggers: `auth/recovery` and `auth/verify-email` (both 1-hour links, `AUTH_LINK_EXPIRY_SECONDS`).

`account/email-changed` and `account/password-changed` stay as they are. Every copy states the real link expiry.

The unused `auth/invite` template is replaced by the organization invitation template.

## UI direction

Build on the shipped system: logo palette tokens, Geist and Bricolage Grotesque, ink shadows, and `src/lib/motion.ts` tokens.

Never revive variants or a preview widget.

- Arrow motif: the certificate's faded arrows become a domain-free `ArrowsMotif` SVG for hero cards, auth pages, empty states, and certificate cards.
- `knip.json` lists `arrows-motif.tsx` in `ignoreFiles` until a lane renders `ArrowsMotif`; the first consumer removes the entry.
- Skill group colors: Work `brand-tertiary`, Social `brand-secondary`, Communication `brand`, Personal a new AA-checked `--brand-quaternary` teal.
- `LevelDots`: the certificate's five dots and level word, reused wherever a skill level appears.
- Certificate thumbnail: an HTML miniature of the PDF layout for cards, the wizard preview, and the verify page.
- Volunteer journey stepper (Learn, Reflect, Request, Review, Certified) driven by real state.
- Motion: springs for input, easing for system motion, one-time celebrations on approval and course completion, reduced motion respected.
- Data surfaces: sortable, filterable tables with counts, pagination, row menus, skeletons, and empty states that explain the next step.
- Copy: short, warm, second person, `humanizer` on long copy. UI says "Represented by"; the PDF keeps "Represent by".

## Execution protocol

### Reading order

1. This folder (`spec.md`, `plan.md`, `tasks.md`, and `pdf.md` for PDF work; `log.md` only for history).
2. `AGENTS.md`, then the spec for the area in `.agents/specs/`.
3. `vercel-react-best-practices` for any React code, then the area skill (`shadcn`, `neon-drizzle`, `react-email`, `agent-browser`).

### Orchestration

- The orchestrator owns `release/v0.7`, W0, schema batches, lane integration, and W2 to W3 verification.
- Lane agents run with `isolation: "worktree"` from the latest `release/v0.7`, never nested, at most four writers at once.
- A lane agent commits one Conventional Commit per finished task, only after `pnpm run check` exits 0 and its tests pass. It never pushes.
- Lanes touch only the files they own (listed in `tasks.md`).
- Shared additions are append-only: own `messages/*.json` namespaces, new tags at the end of `src/lib/cache.ts`.
- Integrating: the orchestrator rebases each lane onto `release/v0.7` and fast-forwards it, or squashes it, never with a merge commit. It unions `messages/*.json` keys on conflict, then reruns `pnpm run check` and `pnpm run test`.
- After each integration, the orchestrator checks the lane's flows on the single dev server at `https://glore.localhost`. Worktrees never start a dev server.

### Effort (Opus 5.5)

The user runs the orchestrator session at `xhigh`. The orchestrator passes `effort` on every Agent call from this table.

| Effort   | Work                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `xhigh`  | The orchestrator session: W0, schema batches, merges, verification judgment. Subagents for A1 (lifecycle), A5 (PDF), B1 and B1b (invitations and consent), B6 (admin and impersonation), G6 (review and security). |
| `high`   | Every other code and verification task, including E1 and the W2 and W3 browser passes.                                                                                                                             |
| `medium` | E2 to E5 content writing and translation.                                                                                                                                                                          |
| `max`    | Never. A stuck task gets a fresh `xhigh` subagent with the failure notes instead.                                                                                                                                  |

### Verification habits

- Browser checks use `agent-browser`, with `--state .playwright/.auth/<role>.json --ignore-https-errors` for fixtures or a demo account login.
- Close every named browser session in the turn that finishes with it.
- Email checks follow the Mailpit procedure in `.agents/specs/workflow.md`.
- Bug fixes start with a failing test, per `AGENTS.md`.

### Stop and ask the user

- Before production writes: migrations, catalog import, env changes.
- Before destructive DB actions, pushes, or a change to a user decision (U1 to U11).
- When an open question (O4, O5) blocks a task.

## Plan upkeep

- Update `tasks.md` in the same commit as the work: status, commit hash, "Next up", and a line in `log.md`.
- Record a changed decision in its row in `spec.md` as "Changed on date: ..." and log it.
- Keep these files complete enough that a fresh agent can resume from them alone; link code paths instead of copying code.
- Delete this folder once v0.7 ships, after moving durable facts into `.agents/specs/`.

## Risks

| Risk                                                                  | Mitigation                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Merge conflicts in `messages/*.json`, `src/lib/cache.ts`, the sidebar | Lane namespaces, append-only shared files, sidebar owned by W2 only.          |
| Content volume (31 courses in 3 locales)                              | Lane E starts first and runs in batches; the importer validates completeness. |
| Vector fidelity of the logo and arrows in react-pdf                   | Fidelity check early in A5; switch to the D19 runner-up if it fails.          |
| Enum additions and column drops on Postgres 17                        | Additive, then data, then drops; tested on `db:reset` and on a staging copy.  |
| Staging preview needs branch-scoped Vercel env vars                   | User step in G8, also listed in `manual-testing.md`.                          |
| Plus-address deliverability on staging                                | Mailpit stays the reference; staging mail is a smoke check.                   |
| Better Auth hardening regressions                                     | e2e asserts closed endpoints, as `smoke.spec.ts` does for sign-up.            |
