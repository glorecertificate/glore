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
- Every `(auth)` page sits in a layout that draws the arrows motif.
- Sessions live in signed HTTP-only cookies (`gl_` prefix). There is no SSO or OAuth.

### Registration and onboarding

- `/register` is a multi-step application (`organizations.md`) that creates a `pending` org and a join request.
- A platform admin approves the request, which sends an invitation, or rejects it.
- Rejection is soft: the admin join request moves to `rejected` and the org record stays visible to platform admins.
- On first login with a null `onboardedAt`, the proxy redirects to `/onboarding`.
- `/onboarding` is a four-step stepper: names, birthday with nationality and place of birth, optional phone with language, and password.
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
- Volunteers keep a skill compass (up to 3 strengths, 5 goals) that drives course recommendations.
- Publication states: archived, draft, partial, published.
- Course types: `intro` (all members, not skill-linked, no assessment), `skill` (volunteers, counts toward certification, has assessment), `learner` (learners, not skill-linked, no assessment).

### Certificates

- Volunteers submit a certificate tied to a volunteering experience: selected skill courses, language, activity dates, duration, location, description, and an organization rating of 1 to 5.
- Submission auto-assigns a tutor. Approval generates the PDF.
- `/verify/<code>` is the canonical public page (`certificates.md`, "Public verification").
- `/{username}` shows the featured certificate for holders who opted in.
- The public page shows a verified badge, volunteer and org, activity metrics, issued date, PDF download, QR code, share meta (Open Graph, Twitter Card), and a join-GloRe CTA.

### AI writing assistant

- The Plate.js editor offers slash commands (`/api/v1/ai/command`: generate, improve, summarize, translate) and a copilot (`/api/v1/ai/copilot`: next word or sentence).
- Google Gemini only, through `@ai-sdk/google` and `GEMINI_API_KEY` (free tier).
- The model chain is `aiModels` in `config/app.json` (`gemini-3.8-flash`, then `gemini-3.5-flash-lite`). `GEMINI_MODEL` is an optional override tried first.
- `src/lib/ai.ts` moves to the next model when one fails before any text streams (404 retired, 429 quota, 5xx).
- It also moves on when a model sends no first token within `aiFirstTokenMs`, because an overloaded model queues requests instead of failing. The last model has no limit.
- A failure after streaming starts is an error part.
- A missing key answers 503 `ai_not_configured`.
- The menu shows a translated error with retry.

### File storage and email

- Cloudflare R2 (`@aws-sdk/client-s3`) stores user avatars, org logos, editor media, and certificate PDFs. Certificate PDFs are public through `documentUrl`.
- SMTP through Nodemailer sends mail at registration, password reset, organization and team invitations, certificate assignment, review decisions, join-request decisions, and password and email changes.

### Admin panel

- `/admin`: overview with totals, 12-month charts, the certificate pipeline, and shortcuts.
- `/admin/team`: invite admins and editors, manage team roles.
- `/admin/users`: server-paged search and filters, ban with reason and expiry, unban, platform roles, and view as user for 15 minutes with an audit log (`admin.md`).
- `/admin/organizations` and `/admin/organizations/[id]`: approve or reject pending orgs, invite new orgs.

### Dashboard

- `/dashboard` renders one server-loaded view per role (`loadDashboard` in `actions/dashboard/`, reusing the certificate, course, organization, and notification reads).
- Volunteer: first-run checklist, journey, eligibility, certificate status, continue learning, goal-based recommendations, latest updates.
- Learner: checklist, continue, recommendations.
- Tutor: assigned and pool counts, oldest waiting, average review time over 90 days, oldest requests table.
- Representative and owner: waiting-for-tutor banner, setup checklist, members, invitations, requests, pipeline, activity.
- Editor and platform admin: content health, translation gaps, enrollment charts. Admins also see pending applications.
- Users without an organization see an empty state.

### Documentation

- `/docs` with `/docs/intro`, `/docs/faq`, `/docs/tutorials`: live-editable guides authored by admins and editors.

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

## Data model

- The Drizzle schema in `src/db/schema/` is the source of truth: per-table files, enums in `enums.ts`, relations in `relations.ts`.
- Do not duplicate column lists here. Enum values are listed in `patterns.md`.

## Out of scope

- Real-time collaboration on course content.
- Payment or subscription management.
- Video hosting (embedded from external sources).
- Native mobile apps (the PWA covers mobile).
- SSO or OAuth login (email and password only).
