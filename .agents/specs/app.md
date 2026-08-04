# GloRe Certificate app specification

## Domain context

GloRe (short for "Global Recognition") certifies the soft skills people gain through volunteering, turning non-formal learning into a credential someone can add to a CV. It exists because volunteering experience is real learning that traditional qualifications do not capture, and HR and educational institutions need a verifiable signal for it. Organizations onboard members who complete structured courses, accumulate skill ratings, and submit certificates that tutors review. Available in English, Spanish, and Italian.

The product is run by [Associazione Joint](https://associazionejoint.org), a Milan non-profit founded in 2003, active in youth mobility, European volunteering, and non-formal education through Erasmus+ and the European Solidarity Corps. GloRe started as an Erasmus+ Capacity Building project (2016 to 2018) and grew into the GloRe Network, an open, free-to-join set of NGOs across Europe and Latin America that issue certificates under shared quality standards.

This repository is the new version of that platform, replacing the live sites at `international.glorecertificate.net` and `local.glorecertificate.net` (launched March 2021). It is not a clone of them: terminology and flows here follow this codebase's data model, not the legacy sites. Three domain facts shape recurring decisions:

- **Network of organizations.** Volunteers join through a member NGO, never as standalone users. The org, membership, and role model plus the registration-as-join-request flow all follow from this.
- **Soft skills as the unit of value.** Skill courses map to the transferable competences GloRe certifies (problem-solving, teamwork, leadership, empathy, and similar), and assessment ratings on those courses gate certificate eligibility.
- **Recognition needs trust.** Tutor review, the approved-then-immutable certificate, the verified public page, and the QR-linked PDF all exist so a third party can trust the credential.

## Users and roles

### Team roles (platform-level)

Set by `isAdmin` / `isEditor` flags on the user record, independent of any organization. Team members always see the admin or editor interface, never the org member view.

| Role     | Permissions                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `admin`  | Full access: user management, org approval and creation, course management, admin panel, team invitations |
| `editor` | Create, edit, translate, and manage courses only. No user or org management, no admin panel            |

### Organization roles (per-membership)

Non-team users hold a role per organization. A user can hold different roles across orgs and switch the active one, stored in a cookie like switching workspaces.

| Role             | Permissions                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `admin` (owner)  | Sole owner, exactly ONE per org. Full org management including deletion. Main point of contact  |
| `representative` | Owner's rights except deletion. Invite members, manage roles, assign tutors. Multiple allowed   |
| `tutor`          | Review certificates assigned to them, self-assign to unreviewed ones. No org or member management |
| `volunteer`      | Enroll in courses, complete lessons, submit evaluations and assessments, request certificates   |
| `learner`        | Enroll in intro and learner courses only. No skill courses, no certificates                     |

The single `admin` is set at registration or by team invitation, and the last admin cannot be removed or demoted. Use `isOrgAdmin` for management checks and `membership.role === 'admin'` for owner-exclusive operations such as deletion.

## Core features

| Feature                   | Description                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication            | Email and password via Better Auth: verification, password reset, profile management. Sessions in signed HTTP-only cookies (`gl_` prefix). No SSO or OAuth                    |
| Registration + onboarding | `/register` submits org details and representative info, creating a `pending` org and join request that a platform admin approves. On first login with null `onboardedAt`, the proxy redirects to `/onboarding` (name, birthday, phone, locale, password), then `/dashboard` |
| Organizations             | `/organization`: overview (member and certificate stats, pending requests), member list with role management, join request approval, settings (name, email, description, address, phone, URL, logo), org switching. Deletion is owner-only and blocked unless the org has zero certificates |
| Courses                   | Multilingual content authored by editors and admins in Plate.js with AI assistance. Ordered lessons hold rich text, multiple-choice questions, evaluations (self-assessment prompts), and one final assessment per lesson (skill courses only, last step). Enrollment records locale; progress is binary per lesson. Publication states: archived, draft, partial, published |
| Course types              | `intro` (all members, not skill-linked, no assessment), `skill` (volunteers, counts toward certification, has assessment), `learner` (learners, not skill-linked, no assessment) |
| Certificates              | Volunteers submit a certificate tied to a volunteering experience: selected skill courses, language, activity dates, duration, location, description, and an organization rating of 1 to 5. Auto-assigned to a tutor on creation. PDF generated on approval |
| Public certificate page   | `/{username}` for the default certificate or `/{username}?v={handle}` for a specific one. Shows verified badge, volunteer and org, activity metrics, description, issued date, PDF download, QR code, share meta (Open Graph, Twitter Card), and a join-GloRe CTA |
| AI writing assistant      | In the Plate.js editor: slash commands (`/api/v1/ai/command`: generate, improve, summarize, translate) and copilot (`/api/v1/ai/copilot`: next word or sentence). Google Gemini via `@ai-sdk/google`, model `gemini-2.0-flash` |
| File storage              | Cloudflare R2 (`@aws-sdk/client-s3`): user avatars, org logos, editor media, certificate PDFs. Certificate PDFs are public via `documentUrl`                                 |
| Email notifications       | SMTP through Nodemailer at registration, password reset, org and team invites, certificate assignment, review decisions, join-request decisions, member added, password and email changes |
| Admin panel               | `/admin/team` (invite admins and editors, manage team roles), `/admin/users` (ban, unban, change platform roles), `/admin/organizations` and `/admin/organizations/[id]` (approve or reject pending orgs, invite new orgs) |
| Dashboard                 | `/dashboard`: role-aware greeting, stats grid (published courses, lessons, skill groups, all courses), course breakdown by type                                              |
| Documentation             | `/docs` with `/docs/intro`, `/docs/faq`, `/docs/tutorials`. Live-editable guides authored by admins and editors                                                              |
| Settings                  | `/settings`: profile (avatar, name, bio, phone, birthday, sex, pronouns, city, country, spoken languages) and account (password, email)                                       |
| PWA                       | Dynamic manifest (`/api/v1/manifest`); display modes TWA, Standalone, MinimalUI, Fullscreen, Browser                                                                          |

## Certificate lifecycle

**Eligibility:** a volunteer can request a certificate after completing at least `minSkills` (3) skill courses with an average assessment rating of at least `minRating` (3 of 5) across completed skill courses. Assessment ratings of 1 to 5 come from the final assessment of each skill course.

**Status flow:**

```
submitted -> in_review -> approved
                       -> changes_requested -> (edit + resubmit) -> submitted -> ...
```

**Reviewer assignment:** on creation a tutor is auto-assigned by load-balancing, picking the org tutor with the fewest assignments. The org admin, representatives, and the assigned tutor can change the assignment, and tutors can self-assign to unreviewed certificates. ONLY tutors review; admins and representatives manage assignment but never review directly.

**Review:** opening the review form transitions the certificate to `in_review`. Approving generates the PDF, uploads it to R2, sets `issuedAt`, and marks it `approved`; the first approved certificate becomes the default on the public profile. Requesting changes records a reviewer comment and sets `changes_requested`, after which the volunteer edits and resubmits, returning to `submitted` with the same reviewer unless it is changed. A tutor may edit `activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`, and the associated skills with their evaluation and assessment data. Email notifications fire on each status transition.

**PDF:** generated on approval and stored at `certificates/{handle}.pdf` in R2, public via `documentUrl`. Inter font, teal `#0f766e`, GloRe header and logo, QR code linking to `/{username}?v={handle}`, and a reviewer signature block.

## Business rules

Rules not already stated above:

1. A user without `onboardedAt` cannot reach dashboard routes; the proxy redirects to `/onboarding`, and an onboarded user hitting `/onboarding` goes to `/dashboard`.
2. Only `isAdmin` users reach `/admin`. Only `isEditor` or `isAdmin` users edit courses; everyone else gets viewer mode.
3. One active organization per session, held in a cookie. Switching org reloads the dashboard context.
4. Once `approved`, a certificate is immutable and publicly visible.
5. All user-facing strings go through next-intl. No hardcoded UI text.
6. App cookies use the `gl_` prefix (`COOKIE_PREFIX` in `src/lib/cookies.ts`; Better Auth uses `gl` via `advanced.cookiePrefix`). The locale cookie `NEXT_LOCALE` has no prefix.
7. A course becomes `published`, meaning visible to learners, once all its lessons have content.

## Data model

The Drizzle schema in `src/db/schema/` is the source of truth: per-table files, enums in `enums.ts`, relations in `relations.ts`. Do not duplicate column lists here. Enum values are listed in `patterns.md`.

## Out of scope

Real-time collaboration on course content, payment or subscription management, video hosting (embedded from external sources), native mobile apps (the PWA covers mobile), and SSO or OAuth login (email and password only).
