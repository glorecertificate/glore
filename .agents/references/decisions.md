# Product decisions

Decisions with IDs from the v0.7 release. Specs and issues cite them by ID (for example U20). Re-verify a decision against the code before you act on it.

## User decisions

### Product and content

- U2: AI-drafted full catalog: the GloRe skills as skill courses in en, es, it, plus intro and learner courses. Published on local and staging, drafts on production.
  - Changed on 2026-10-22: 21 skills became 25 (U8).
- U4: No marketing landing. The app stays logged-in plus a public verification page. `/` keeps redirecting.
- U8: Skills match glorecertificate.net: the 25 skills of the GloRe platform in 4 groups, listed in "Skill framework" below.
- U9: The activity rule is 3 months or 100 hours.
- U10: The Erasmus+ emblem stays on every certificate for now.
- U11: v0.7 ships temporary privacy, terms, and Quality Charter texts. The GloRe team supplies the final texts later.
- U12: Changed on 2026-10-22 (D24, U11): legal pages drop the "Temporary text" banner, the `temporary` front matter flag, and the "temporary text" intro sentence before launch.
- U18: Decided on 2026-10-23: the database owns all team-edited copy. UI strings use overrides on top of the bundled catalogs, edited in the app. Crowdin is removed (`translations.md`).
- U19: Editors draft and publish UI strings and content translations. Admins own the protected namespaces (certificate PDF, public certificate, legal, metadata, email subjects), legal publishing, and settings.
- U20: Legal pages are versioned in the database, published versions are immutable, users accept the terms at registration and onboarding, and only a `material` terms version asks again.

### Copy, privacy, and test data

- U1: Agents test on local Docker Postgres plus Mailpit. A new Neon branch `staging` (child of `production`) gets the same demo seed for manual testing on a Vercel preview.
- U3: The PDF matches the template, holds 3 to 4 skills, and adds a small QR, the certificate ID, and the verify URL in the empty bottom-left area.
- U5: Test accounts are plus-addresses of `TEST_EMAIL` (set by the user in `.env.local`). The real address never appears in tracked files.
- U13: Organization role `admin` reads Owner (en), Administrador/a (es), Amministratore (it). Platform admins read Admin in all three languages. Only labels change, the stored value `admin` stays.
- U14: Changed on 2026-10-22 (eea02591): issued certificates stay valid and keep every original detail after the holder deletes the account.
  - The verify page may note that the holder left. Managers can still revoke.
- U15: Spanish login title and meta title read "Únete a la red GloRe", matching the other es copy. "Únete a el GloRe Network" was ungrammatical.
- U16: Invitation copy never names a role as the sender: "someone from your organization", "alguien de tu organización", "qualcuno della tua organizzazione". Owner wording stays for owner-only actions.
- U17: The privacy policy says that, to solve support requests, GloRe staff can view the platform as the user and that every such access is logged. Reviewed in en, es, and it.

## Skill framework (U8)

Names and groups come from the orientation screen in GloRe's "Certification Platform User Guide 3", page 14.

The guide is linked from `local.glorecertificate.net/framework/`.

glorecertificate.net claims 25 skills, and all 8 of its skill pages (`/soft-skills/<slug>/`) are in this list.

- Communication skills (4): Communication and active listening, Assertiveness, Public speaking, Digital communication.
- Personal skills (8): Empathy, Self-awareness, Critical thinking, Responsibility, Leadership, Creativity and innovation, Learning to learn, Confidence in oneself and others.
- Work skills (8): Organization and time management, Team work, Autonomy, Stress management, Problem solving, Decision making, Initiative, Work ethic and commitment.
- Social skills (5): Socio-cultural / multi-cultural awareness, Flexibility, Conflict management, Open-mindedness and tolerance, Networking and public relations.

- Definitions for 21 skills come from GloRe's Skills Board (`local.glorecertificate.net/wp-content/uploads/2022/02/Skills-Board_Glore.pdf`).
- Problem solving uses the glorecertificate.net definition: "Ability to find innovative or efficient solutions to challenges."
- Decision making, Initiative, and Work ethic and commitment have no published definition. Draft definitions wait for GloRe review in #40.
- Spanish and Italian names follow the `/es/` and `/it/` skill pages of glorecertificate.net where they exist.

## Planner decisions

### Certificate lifecycle

- D2: Levels 1 to 5: Absent, Basic, Intermediate, Good, Advanced. Level 1 is not allowed on an issued certificate. The tutor removes the skill instead.
  - Runner-up: Numeric labels only.
- D3: States: `draft`, `submitted`, `in_review`, `changes_requested`, `approved`, `rejected`, `withdrawn`, `revoked`. Reject is terminal with a reason. Revoke keeps the record and shows "Revoked on date".
  - No expiry.
  - Runner-up: Nullable `expiresAt`.
- D4: One open request (`submitted`, `in_review`, `changes_requested`) per user and org at a time. Several approved certificates per user and org are allowed for new periods.
  - Runner-up: One certificate per user and org.
- D5: Public `code`: Crockford base32 `XXXX-XXXX-XXXX` (60 random bits), unique. `/verify/[code]` is canonical. Legacy `/{username}?v={handle}` redirects.
  - Runner-up: `XXXX-XXXX-XXXX-XXXX`.
- D6: `/verify/[code]` shows the holder's full name, is `noindex`, and is rate limited. `/{username}` profiles are opt-in, off by default (GDPR article 25). Runner-up: Youthpass name check, if GloRe's DPO asks.
- D9: Method elements return: required reflection at each self-assessment, tutor-confirmed level and statement per skill, blind tutor evaluation, anonymous org rating shown only as an aggregate of 3 or more.

### Certificate PDF

- D7: PDF content mirrors the template: holder snapshot, period, hours, location, partner org, 1 to 4 tasks (110 chars each), signatory, issue date, 3 to 4 skills (statement up to 200 chars, level).
  - Labels follow its language.
- D19: PDF engine stays `@react-pdf/renderer` with bundled Roboto TTFs, vector logo and arrows from the template, and the template's Erasmus+ PNG. The banner text is localized.
  - Runner-up: `pdf-lib` over a static base PDF, if fidelity fails.
- D20: The Erasmus+ footer stays in every language and on every certificate, as in the template (U10). Runner-up: Remove for non-Erasmus orgs, if GloRe asks later.

### Organizations and accounts

- D10: Users gain `nationality` and `birthPlace`. Onboarding collects them (last name required). The certificate request requires them and lets the volunteer fill them inline.
- D11: Invitations never create memberships. Acceptance does. Pending list, resend, revoke, 7-day expiry, bulk paste, invite links with optional approval, ownership transfer, leave org.
  - Removal keeps certificates.
  - Runner-up: 14-day expiry, if volunteers accept slowly.
- D12: `/register` becomes an application (legal representative, registry ID, contact, website, volunteers per year, motivation, Quality Charter). Approval sends an invitation instead of linking an account.
- D16: Login accepts email or username. Onboarding completion and the welcome email show the username.
- D25: Team members (platform admins, editors) never see the org member interface: the Organization nav item hides for them.

### Learning and content

- D1: Framework: the 25 skills of U8, one skill course each. "Work" becomes "Work skills".
  - The 4 skills outside the framework PDFs go to Work skills, inferred from the old platform's list, which is ordered by group.
  - Runner-up: Problem solving and Decision making in Personal skills, if GloRe answers #40 that way.
- D8: Eligibility: `minSkills` (3) completed skill courses, average self-assessment of at least `minRating` (3), and an activity of `minActivityHours` (100) or `minActivityMonths` (3).
  - All live in `config/app.json`.
  - Confirmed by U9.
- D15: Course overview with explicit Start, resume, server-side quiz grading with explanations and retries, completion screen with rating, learner language switch, skill compass. No streaks or leaderboards.
  - Runner-up: Opt-in streak after v0.7.
- D22: Subagents author course content as files in `content/` (Markdown per locale), imported by a script that converts Markdown to Plate values. Gemini stays the in-editor assistant.
- D23: Locales stay en, es, it. Turkish and Portuguese are deferred. Runner-up: Add tr and pt after v0.7.

### Platform

- D13: In-app notification center plus email for every actionable event. Transactional mail is mandatory. Optional categories toggle in settings.
  - Daily cron: review reminders at 3 and 7 days, escalation, invite reminder on day 5.
  - Runner-up: Per-event channel matrix.
- D14: One append-only `activity_events` table powers the certificate timeline, the org activity feed, and the admin audit log. Runner-up: Separate audit table.
- D17: Charts use shadcn Chart (Recharts), lazy-loaded on analytics pages only. Runner-up: Extend the SVG `area-chart`, if bundle size regresses.
- D18: Platform admins impersonate non-admins through the Better Auth admin plugin: reason, banner, 15 minutes, audit.
  - Changed on 2026-10-22: stock Better Auth impersonation with `sessions.impersonated_by` (migration 0024).
  - Runner-up: Drop it, if the privacy policy forbids it.
- D21: `db:seed` keeps e2e fixtures (`<role>@glore.test`, password `Password1!`). New `db:seed:demo` builds demo data on `TEST_EMAIL` plus-addresses, with a `--target staging` host guard.
  - Production is never seeded.
- D24: Static `/privacy` and `/terms` ship with temporary text, marked as such, until the GloRe team supplies final texts (U11). U20 replaces the static pages.
  - Only essential cookies and cookieless analytics, so no cookie banner.
