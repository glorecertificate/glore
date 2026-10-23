# GloRe v0.7 release: spec

Goals, decisions, and acceptance for the first production release.

Companion files: `plan.md` (architecture, protocol), `tasks.md` (checklist, status, follow-ups), `log.md` (history), `pdf.md` (certificate PDF).

Read `spec.md`, `plan.md`, `tasks.md`, and `pdf.md` before working on v0.7, and keep `tasks.md` current as you go.

## Goal

Ship v0.7 at `https://elearning.glorecertificate.net` for volunteers, learners, tutors, organizations, editors, and platform admins.

The product must be stable, complete for every role, and polished enough to replace the abandoned GloRe e-learning platform.

## Definition of done

1. Every task in `tasks.md` is done, or deferred with a reason the user accepted.
2. `pnpm run check` exits 0, `pnpm run test` passes, and `pnpm run test:e2e` passes locally and in CI.
3. Every verification matrix row passed in `agent-browser` at desktop and 390px widths, in light and dark themes.
4. Every email template was received in Mailpit and opened, in `en` plus `es` or `it`.
5. A generated PDF passes the fidelity check in `pdf.md`.
6. Local and Neon `staging` hold the demo dataset, and `.agents/references/manual-testing.md` matches the shipped behavior.
7. `AGENTS.md`, `README.md`, and `.agents/specs/*` describe the shipped routes, data model, and flows.

## Evidence (gathered 2026-10-22)

Re-verify any claim against the code before acting on it.

| Source                 | Key findings                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI inventory           | Routes render but are thin. Dead controls: dashboard "Request certificate", org switcher "Add organization", `/admin` parent link. Synthetic engagement chart. Quiz options all read "True". Drafts can never be submitted. Username hidden after onboarding. Hardcoded English in several files. No notifications, no PWA prompt.                                                                                                  |
| Backend inventory      | Org approval and invites link existing accounts without consent. No invitation pending list, revoke, or org resend. A sole owner can never hand over. Org join requests can never be approved (`canReviewRequestRole`). Quizzes are ungraded and `isCorrect` may reach the client. No reject, withdraw, or revoke. One non-draft certificate per user and org blocks new periods.                                                   |
| Backend inventory      | PDF is English-only with no ID or QR and fetches Inter from a CDN at approval. `deleteAccount` likely fails for course creators and inviters (NOT NULL FKs). `/api/auth/admin/*` is live over HTTP. Several cache invalidations are missing. Seed has no courses or certificates.                                                                                                                                                   |
| Live GloRe sites       | 25 skills in 4 groups on the old platform; the framework PDFs define 21 of them. Levels Absent, Basic, Intermediate, Good, Advanced. Eligibility: 3 months full time or 100 hours within 10 months. Certificates held 2 to 5 skills. Self-assessment needs a concrete example. Tutors confirm, raise, or lower levels, fill a blind evaluation, and can reject. Volunteers rate the org anonymously (comment up to 400 characters). |
| Live GloRe sites       | Registration collected birth date, birth place, and nationality. Orgs join by application: legal representative, contact person, motivation, Quality Charter acceptance.                                                                                                                                                                                                                                                            |
| Best-practice research | Credly, Accredible, Certifier, Europass, Open Badges 3.0, Youthpass, Coursera, LinkedIn Learning, Khan Academy, Duolingo, Slack, GitHub, Vercel, Linear, Notion, Submittable, Better Impact. Adopted patterns appear in the decisions below.                                                                                                                                                                                        |
| Data                   | Local DB and Neon `production` hold placeholder content only: 5 one-lesson courses, 4 skill groups ("Work", "Personal skills", "Social skills", "Communication skills"), no certificates. Lesson `content` is `{ en, es, it: PlateValue[] }`.                                                                                                                                                                                       |

## User decisions (2026-10-22)

| ID  | Decision                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | Agents test on local Docker Postgres plus Mailpit. A new Neon branch `staging` (child of `production`) gets the same demo seed for manual testing on a Vercel preview.                                           |
| U2  | AI-drafted full catalog: the GloRe skills as skill courses in en, es, it, plus intro and learner courses. Published on local and staging, drafts on production. Changed on 2026-10-22: 21 skills became 25 (U8). |
| U3  | The PDF matches the template, holds 3 to 4 skills, and adds a small QR, the certificate ID, and the verify URL in the empty bottom-left area.                                                                    |
| U4  | No marketing landing. The app stays logged-in plus a public verification page; `/` keeps redirecting.                                                                                                            |
| U5  | Test accounts are plus-addresses of `TEST_EMAIL` (set by the user in `.env.local`). The real address never appears in tracked files.                                                                             |
| U6  | One Conventional Commit per finished task on local lane branches, merged into local `release/v0.7`. Nothing is pushed until the user asks.                                                                       |
| U7  | Plans live in `.agents/plans/`; `AGENTS.md` was updated from `.agents/plan/`.                                                                                                                                    |
| U8  | Skills match glorecertificate.net: the 25 skills of the GloRe platform in 4 groups, listed in "Skill framework" below.                                                                                           |
| U9  | The activity rule is 3 months or 100 hours.                                                                                                                                                                      |
| U10 | The Erasmus+ emblem stays on every certificate for now.                                                                                                                                                          |
| U11 | v0.7 ships temporary privacy, terms, and Quality Charter texts; the GloRe team supplies the final texts later.                                                                                                   |
| U12 | Changed on 2026-10-22 (D24, U11): legal pages drop the "Temporary text" banner, the `temporary` front matter flag, and the "temporary text" intro sentence before launch.                                        |
| U13 | Organization role `admin` reads Owner (en), Administrador/a (es), Amministratore (it); platform admins read Admin in all three languages. Only labels change, the stored value `admin` stays.                    |
| U14 | Changed on 2026-10-22 (c7a1c65b): issued certificates stay valid and keep every original detail after the holder deletes the account. The verify page may note that the holder left; managers can still revoke.  |
| U15 | Spanish login title and meta title read "Únete a la red GloRe", matching the other es copy; "Únete a el GloRe Network" was ungrammatical.                                                                        |
| U16 | Invitation copy never names a role as the sender: "someone from your organization", "alguien de tu organización", "qualcuno della tua organizzazione". Owner wording stays for owner-only actions.               |
| U17 | The privacy policy says that, to solve support requests, GloRe staff can view the platform as the user and that every such access is logged. Reviewed in en, es, and it.                                         |

## Skill framework (U8)

Names and groups come from the orientation screen in GloRe's "Certification Platform User Guide 3", page 14.

The guide is linked from `local.glorecertificate.net/framework/`.

glorecertificate.net claims 25 skills, and all 8 of its skill pages (`/soft-skills/<slug>/`) are in this list.

| Group (old platform order) | Skills                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Communication skills (4)   | Communication and active listening, Assertiveness, Public speaking, Digital communication.                                                              |
| Personal skills (8)        | Empathy, Self-awareness, Critical thinking, Responsibility, Leadership, Creativity and innovation, Learning to learn, Confidence in oneself and others. |
| Work skills (8)            | Organization and time management, Team work, Autonomy, Stress management, Problem solving, Decision making, Initiative, Work ethic and commitment.      |
| Social skills (5)          | Socio-cultural / multi-cultural awareness, Flexibility, Conflict management, Open-mindedness and tolerance, Networking and public relations.            |

- Definitions for 21 skills come from GloRe's Skills Board (`local.glorecertificate.net/wp-content/uploads/2022/02/Skills-Board_Glore.pdf`).
- Problem solving uses the glorecertificate.net definition: "Ability to find innovative or efficient solutions to challenges."
- Decision making, Initiative, and Work ethic and commitment have no published definition; E2 drafts one in the Skills Board style for GloRe review (O5).
- Spanish and Italian names follow the `/es/` and `/it/` skill pages of glorecertificate.net where they exist.

## Planner decisions (the user may override)

| ID  | Decision                                                                                                                                                                                                                           | Runner-up (switch trigger)                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| D1  | Framework: the 25 skills of U8, one skill course each. "Work" becomes "Work skills". The 4 skills outside the framework PDFs go to Work skills, inferred from the old platform's list, which is ordered by group.                  | Problem solving and Decision making in Personal skills, if GloRe answers O5 that way. |
| D2  | Levels 1 to 5: Absent, Basic, Intermediate, Good, Advanced. Level 1 is not allowed on an issued certificate; the tutor removes the skill instead.                                                                                  | Numeric labels only.                                                                  |
| D3  | States: `draft`, `submitted`, `in_review`, `changes_requested`, `approved`, `rejected`, `withdrawn`, `revoked`. Reject is terminal with a reason. Revoke keeps the record and shows "Revoked on date". No expiry.                  | Nullable `expiresAt`.                                                                 |
| D4  | One open request (`submitted`, `in_review`, `changes_requested`) per user and org at a time. Several approved certificates per user and org are allowed for new periods.                                                           | One certificate per user and org.                                                     |
| D5  | Public `code`: Crockford base32 `XXXX-XXXX-XXXX` (60 random bits), unique. `/verify/[code]` is canonical; legacy `/{username}?v={handle}` redirects.                                                                               | `XXXX-XXXX-XXXX-XXXX`.                                                                |
| D6  | `/verify/[code]` shows the holder's full name, is `noindex`, and is rate limited. `/{username}` profiles are opt-in, off by default (GDPR article 25).                                                                             | Youthpass name check, if GloRe's DPO asks.                                            |
| D7  | PDF content mirrors the template: holder snapshot, period, hours, location, partner org, 1 to 4 tasks (110 chars each), signatory, issue date, 3 to 4 skills (statement up to 200 chars, level). Labels follow its language.       | None.                                                                                 |
| D8  | Eligibility: `minSkills` (3) completed skill courses, average self-assessment of at least `minRating` (3), and an activity of `minActivityHours` (100) or `minActivityMonths` (3). All live in `config/app.json`. Confirmed by U9. | None.                                                                                 |
| D9  | Method elements return: required reflection at each self-assessment, tutor-confirmed level and statement per skill, blind tutor evaluation, anonymous org rating shown only as an aggregate of 3 or more.                          | None.                                                                                 |
| D10 | Users gain `nationality` and `birthPlace`. Onboarding collects them (last name required); the certificate request requires them and lets the volunteer fill them inline.                                                           | None.                                                                                 |
| D11 | Invitations never create memberships; acceptance does. Pending list, resend, revoke, 7-day expiry, bulk paste, invite links with optional approval, ownership transfer, leave org. Removal keeps certificates.                     | 14-day expiry, if volunteers accept slowly.                                           |
| D12 | `/register` becomes an application (legal representative, registry ID, contact, website, volunteers per year, motivation, Quality Charter). Approval sends an invitation instead of linking an account.                            | None.                                                                                 |
| D13 | In-app notification center plus email for every actionable event. Transactional mail is mandatory; optional categories toggle in settings. Daily cron: review reminders at 3 and 7 days, escalation, invite reminder on day 5.     | Per-event channel matrix.                                                             |
| D14 | One append-only `activity_events` table powers the certificate timeline, the org activity feed, and the admin audit log.                                                                                                           | Separate audit table.                                                                 |
| D15 | Course overview with explicit Start, resume, server-side quiz grading with explanations and retries, completion screen with rating, learner language switch, skill compass. No streaks or leaderboards.                            | Opt-in streak after v1.                                                               |
| D16 | Login accepts email or username. Onboarding completion and the welcome email show the username.                                                                                                                                    | None.                                                                                 |
| D17 | Charts use shadcn Chart (Recharts), lazy-loaded on analytics pages only.                                                                                                                                                           | Extend the SVG `area-chart`, if bundle size regresses.                                |
| D18 | Platform admins impersonate non-admins through the Better Auth admin plugin: reason, banner, 15 minutes, audit. Changed on 2026-10-22: stock Better Auth impersonation with `sessions.impersonated_by` (migration 0024).           | Drop it, if the privacy policy forbids it.                                            |
| D19 | PDF engine stays `@react-pdf/renderer` with bundled Roboto TTFs, vector logo and arrows from the template, and the template's Erasmus+ PNG. The banner text is localized.                                                          | `pdf-lib` over a static base PDF, if fidelity fails.                                  |
| D20 | The Erasmus+ footer stays in every language and on every certificate, as in the template (U10).                                                                                                                                    | Remove for non-Erasmus orgs, if GloRe asks later.                                     |
| D21 | `db:seed` keeps e2e fixtures (`<role>@glore.test`, password `Password1!`). New `db:seed:demo` builds demo data on `TEST_EMAIL` plus-addresses, with a `--target staging` host guard. Production is never seeded.                   | None.                                                                                 |
| D22 | Subagents author course content as files in `content/` (Markdown per locale), imported by a script that converts Markdown to Plate values. Gemini stays the in-editor assistant.                                                   | None.                                                                                 |
| D23 | Locales stay en, es, it. Turkish and Portuguese are deferred.                                                                                                                                                                      | Add tr and pt after v1.                                                               |
| D24 | Static `/privacy` and `/terms` ship with temporary text, marked as such, until the GloRe team supplies final texts (U11). Only essential cookies and cookieless analytics, so no cookie banner.                                    | None.                                                                                 |
| D25 | Team members (platform admins, editors) never see the org member interface: the Organization nav item hides for them.                                                                                                              | None.                                                                                 |

## Open questions for GloRe (non-blocking)

The user answered O1 to O3 and the legal texts of O4 on 2026-10-22 (U8 to U11).

- O4: a GloRe LinkedIn Page ID for "Add to profile"; until then the link passes `organizationName`.
- O5: the group and definition of Problem solving, Decision making, Initiative, and Work ethic and commitment (D1, "Skill framework").

## Deferred beyond v0.7

| Area          | Deferred items                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Network       | Trial, full, and ally tiers; org email-domain allowlist; public landing page.                   |
| Credentials   | Open Badges 3.0 export, Europass EDC, ESCO mapping, multi-signatory, re-issue after correction. |
| Members       | CSV bulk invite.                                                                                |
| Notifications | Push, Slack, digests, per-event channel matrix.                                                 |
| Learning      | Streaks, leaderboards, learning paths, course Q&A.                                              |
| Platform      | Audit export, tr and pt locales.                                                                |
