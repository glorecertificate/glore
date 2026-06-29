# GloRe Certificate, app specification

## Overview

GloRe Certificate is a multilingual e-learning platform that helps volunteers get their soft skills recognized with an official certificate. Organizations onboard members who complete structured courses, accumulate skill ratings, and submit certificates reviewed by tutors. The platform supports platform-level team roles, five organization roles, a rich content editor with AI-assisted writing, full organization management, and a public certificate page per user. Available in English, Spanish, and Italian.

## Domain context

GloRe (short for "Global Recognition") certifies the soft skills people gain through volunteering, turning non-formal learning into a credential they can add to a CV. It exists because volunteering experience is real learning that traditional qualifications do not capture, and HR and educational institutions need a verifiable signal for it.

The product is run by [Associazione Joint](https://associazionejoint.org), a Milan non-profit (founded 2003) active in youth mobility, European volunteering, and non-formal education through Erasmus+ and the European Solidarity Corps. GloRe started as an Erasmus+ Capacity Building project (2016 to 2018) and grew into the GloRe Network, an open, free-to-join set of NGOs across Europe and Latin America that issue certificates under shared quality standards.

This repository is the new version of that platform, replacing the live public sites at `international.glorecertificate.net` and `local.glorecertificate.net` (launched March 2021). It is not a clone of them: terminology and flows here follow this codebase's data model, not the legacy sites. The domain shapes recurring concepts:

- **Network of organizations.** Volunteers join through a member NGO, never as standalone users. The org/membership/role model and the registration-as-join-request flow follow from this.
- **Soft skills as the unit of value.** Skill courses map to the transferable competences GloRe certifies (problem-solving, teamwork, leadership, empathy, and similar). Assessment ratings on those courses gate certificate eligibility.
- **Recognition needs trust.** Tutor review, the approved-then-immutable certificate, the verified public page, and the QR-linked PDF all exist so a third party can trust the credential.

## Users and roles

### Team roles (platform-level)

Set by `isAdmin` / `isEditor` flags on the user record, independent of any organization. Team members always see the admin/editor interface, never the org member view.

| Role     | Permissions                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `admin`  | Full access: user management, org approval/creation, course management, admin panel, team invitations.  |
| `editor` | Create, edit, translate, and manage courses only. No user/org management, no admin panel.               |

### Organization roles (per-membership)

Non-team users have a role tied to each organization they belong to. A user can hold different roles across orgs and switch active organization (stored in a cookie, like switching workspaces).

| Role             | Permissions                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `admin` (owner)  | Sole owner, ONE per org. Full org management including deletion. Main point of contact.                 |
| `representative` | Same rights as owner except deletion. Invite members, manage roles, assign tutors. Multiple allowed.    |
| `tutor`          | Review certificates assigned to them, self-assign to unreviewed ones. No org/member management.         |
| `volunteer`      | Enroll in courses, complete lessons, submit evaluations/assessments, request certificates.              |
| `learner`        | Enroll in intro and learner courses only. No skill courses, no certificates.                            |

Constraints:

- Exactly ONE `admin` (owner) per org, set at registration or by team invitation. The last admin cannot be removed or demoted.
- `representative` rights equal the owner's except they cannot delete the org.
- Use `isOrgAdmin` for management checks; `membership.role === 'admin'` for owner-exclusive operations (deletion).

## Core features

| Feature                  | Description                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication           | Email/password via Better Auth: verification, password reset, profile management. Sessions in signed HTTP-only cookies (`gl_` prefix). No SSO/OAuth.                         |
| Registration + onboarding | `/register` submits org details + representative info, creating a `pending` org and join request approved by a platform admin. On first login with null `onboardedAt`, the proxy redirects to `/onboarding` (name, birthday, phone, locale, password), then `/dashboard`. |
| Organizations            | `/organization`: overview (member/certificate stats, pending requests), member list with role management, join request approval, settings (name, email, description, address, phone, URL, logo), org switching. Deletion allowed only for the owner and only when the org has zero certificates. |
| Courses                  | Multilingual content authored by editors/admins in Plate.js with AI assistance. Ordered lessons hold rich text, questions (multiple choice), evaluations (self-assessment prompts), and one final assessment per lesson (skill courses only, last step). Enrollment records locale; progress is binary per lesson. Publication states: archived, draft, partial, published. |
| Course types             | `intro` (all members, not skill-linked, no assessment), `skill` (volunteers, counts toward certification, has assessment), `learner` (learners, not skill-linked, no assessment).                                                                          |
| Certificates             | Volunteers submit a certificate tied to a volunteering experience: selected skill courses, language, activity dates/duration/location/description, organization rating (1 to 5). Auto-assigned to a tutor on creation. PDF generated on approval. |
| Public certificate page  | `/{username}` (default certificate) or `/{username}?v={handle}` (specific). Shows verified badge, volunteer + org, activity metrics, description, issued date, PDF download, QR code, share meta (Open Graph, Twitter Card), and a join-GloRe CTA. |
| AI writing assistant     | In the Plate.js editor: slash commands (`/api/v1/ai/command`: generate, improve, summarize, translate) and copilot (`/api/v1/ai/copilot`: next-word/sentence). Provider: Google Gemini via `@ai-sdk/google`, model `gemini-2.0-flash`. |
| File storage             | Cloudflare R2 (`@aws-sdk/client-s3`): user avatars, org logos, editor media, certificate PDFs. Certificate PDFs are public via `documentUrl`.                               |
| Email notifications      | SMTP (Nodemailer) transactional emails at registration, password reset, org/team invites, certificate assignment, review decisions, join-request decisions, member added, password/email changes. |
| Admin panel              | `/admin/team` (invite admins/editors, manage team roles), `/admin/users` (moderation: ban/unban, change platform roles), `/admin/organizations` and `/admin/organizations/[id]` (approve/reject pending orgs, invite new orgs). |
| Dashboard                | `/dashboard`: role-aware greeting, stats grid (published courses, lessons, skill groups, all courses), course breakdown by type.                                            |
| Documentation            | `/docs` with `/docs/intro`, `/docs/faq`, `/docs/tutorials`. Live-editable guides authored by admins/editors.                                                                |
| Settings                 | `/settings`: profile (avatar, name, bio, phone, birthday, sex, pronouns, city, country, spoken languages) and account (password, email).                                    |
| Internationalization     | next-intl, locales `en` (default), `es`, `it`. Title-case for `en` only. Locale cookie `NEXT_LOCALE` (no prefix). DB text fields use `IntlRecord`.                          |
| PWA                      | Dynamic manifest (`/api/v1/manifest`); display modes TWA, Standalone, MinimalUI, Fullscreen, Browser.                                                                        |

## Certificate lifecycle

### Eligibility

A volunteer can request a certificate after completing at least `minSkills` (3) skill courses with an average assessment rating across completed skill courses of at least `minRating` (3 of 5). Assessment ratings (1 to 5) come from the final assessment of each skill course.

### Status flow

```
submitted -> in_review -> approved
                       -> changes_requested -> (edit + resubmit) -> submitted -> ...
```

### Reviewer assignment

- On creation, a tutor is auto-assigned by load-balancing (the org tutor with the fewest assignments).
- Org admin, representatives, and the assigned tutor can change the assignment. Tutors can self-assign to unreviewed certificates.
- ONLY tutors review. Admins and representatives manage assignment but never review directly.

### Review

- Opening the review form transitions the certificate to `in_review`.
- Approve: generates the PDF, uploads to R2, sets `issuedAt`, marks `approved`. The first approved certificate becomes the default on the public profile.
- Request changes: records a reviewer comment, sets `changes_requested`. The volunteer edits and resubmits, returning to `submitted` with the same reviewer unless changed.
- Editable by the tutor during review: `activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`, and the associated skills with their evaluation/assessment data.
- Email notifications fire on each status transition.

### PDF

Generated on approval and stored at `certificates/{handle}.pdf` in R2, public via `documentUrl`. Matches the template at `.agents/assets/certificate-template.pdf`: Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.

## Business rules

1. A user without `onboardedAt` cannot access dashboard routes; the proxy redirects to `/onboarding`. An onboarded user hitting `/onboarding` is sent to `/dashboard`.
2. Only `isAdmin` users access `/admin`. Only `isEditor` or `isAdmin` users edit courses; others get viewer mode.
3. Certificates require at least `minSkills` (3) completed skill courses and an average assessment rating of at least `minRating` (3 of 5).
4. One active organization per session (cookie). Switching org reloads dashboard context.
5. A certificate must be `submitted` before a tutor begins review. Once `approved`, it is immutable and publicly visible.
6. ONLY tutors review certificates; admins/representatives manage assignment. Auto-assignment is load-balanced; tutors can self-assign to unreviewed certificates.
7. Volunteers can edit and resubmit after `changes_requested`, returning to `submitted`.
8. Exactly ONE org admin (owner); multiple representatives allowed. Only the owner deletes the org, and only when no certificates exist.
9. All user-facing strings go through next-intl; no hardcoded UI text.
10. App cookies use the `gl_` prefix (`COOKIE_PREFIX` constant in `src/lib/cookies.ts`; Better Auth uses `gl` via `advanced.cookiePrefix`). The locale cookie `NEXT_LOCALE` has no prefix.
11. A course becomes `published` (visible to learners) once all its lessons have content.

## Data model

Drizzle schema in `src/db/schema/` is the source of truth (per-table files; enums in `enums.ts`, relations in `relations.ts`). Do not duplicate column lists here.

Enums: `certificate_status` (draft, submitted, in_review, changes_requested, approved), `course_type` (intro, skill, learner), `organization_request_status` (pending, accepted, rejected), `role` (admin, learner, tutor, representative, volunteer).

## Out of scope

- Real-time collaboration on course content
- Payment / subscription management
- Video hosting (embedded from external sources)
- Native mobile apps (PWA covers mobile)
- SSO / OAuth login (email/password only)
