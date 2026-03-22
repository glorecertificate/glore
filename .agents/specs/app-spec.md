# GloRe Certificate — App Specification

> **Agent instructions:** Read this file at the start of every session and before starting any feature work. This is the canonical description of what the application does, who uses it, and what the expected behavior is. Never implement anything that contradicts this spec without first flagging it to the user.
>
> **Location:** `.agents/specs/app-spec.md` — this file is tracked in git.

---

## Overview

GloRe Certificate is a multilingual e-learning platform that helps volunteers get their soft skills recognized with an official certificate. Organizations onboard members who complete structured courses, accumulate skill ratings, and submit certificates that are reviewed by tutors. The platform supports five distinct organization roles, a rich content editor for course authoring, AI-assisted writing, full organization management, and a public certificate page per user. The app is available in English, Spanish, and Italian.

---

## Users and roles

### Team roles (platform-level)

Users can be team members of GloRe with a global role of **admin** or **editor**:

| Role     | Scope    | Description                               | Permissions                                                                                                            |
| -------- | -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `admin`  | Platform | Platform administrator, full control      | Full access to all resources: user management, org approval/creation, course management, admin panel, team invitations |
| `editor` | Platform | Course content manager, invited by admins | Create, edit, translate, and manage courses ONLY. Cannot invite users, manage orgs, or access admin panel              |

Team members (admins and editors) can operate independently of organizations or belong to one. Their interface always reflects the admin/editor role, never the organization member view.

### Organization roles (per-membership)

Non-admin, non-editor users have their role **tied to the organization** they belong to. A user can have different roles across different organizations and can switch active organization like switching workspaces.

| Role             | Scope        | Description                                               | Permissions                                                                                                                                |
| ---------------- | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `admin`          | Organization | Sole owner of the org (ONE per org)                       | Full org management: members, roles, settings, deletion. Main point of contact. Created when org is registered or invited by a team member |
| `representative` | Organization | Co-manager (multiple allowed)                             | Same rights as org admin EXCEPT org deletion. Can invite members, manage roles, assign tutors. Invited by admin or other representatives   |
| `tutor`          | Organization | Certificate reviewer                                      | Review certificates assigned to them, self-assign to unreviewed certificates. Cannot manage org or members                                 |
| `volunteer`      | Organization | Main user: completes skill courses, requests certificates | Enroll in courses, complete lessons, submit evaluations/assessments, request certificates, view own certificate status                     |
| `learner`        | Organization | Limited user: completes non-skill courses only            | Enroll in intro and learner courses only. Cannot request certificates or access skill courses                                              |

**Key constraints:**

- Each organization has exactly ONE `admin` (the owner). This user is the initial registrant or gets invited by a team member.
- `representative` users have the same management rights as the org admin, except they cannot delete the organization.
- The org admin is the person everyone refers to when dealing with the organization.
- At least one admin must always exist; the last admin cannot be removed or demoted.
- `is_admin` on the user record grants platform-level admin access (separate from org `admin` role).
- `is_editor` on the user record grants course editing access.

---

## Core features

### 1. Authentication

Email/password login and registration via Better Auth. Email verification, password reset, and profile management. Session tokens in signed HTTP-only cookies with `gl_` prefix.

### 2. Registration and onboarding

**Registration flow (organization request):**

1. New user navigates to `/register` and submits organization details (name, email, city, country, URL) plus representative info (firstName, lastName, email, optional message).
2. This creates an organization in `pending` status and a join request. The org must be approved by a platform admin before the user can access the platform.
3. Platform admins can also invite organizations directly from the admin panel, which creates the org + sends an email invitation to the designated admin.

**Onboarding flow:**

1. After email verification + org approval, user logs in.
2. If `onboardedAt` is null, proxy redirects to `/onboarding`.
3. User fills onboarding form: firstName, lastName, birthday, phone, locale, password.
4. `onboardedAt` is set, user is redirected to `/dashboard`.

### 3. Organizations

Users belong to one or more organizations. Each org has:

- **One admin** (owner): sole person who can delete the org. Created on registration or admin invitation.
- **Multiple representatives**: same rights as admin except deletion. Can invite and manage members.
- **Tutors**: review certificates assigned to them.
- **Volunteers**: complete courses and request certificates.
- **Learners**: complete non-skill courses only.

Organization management features (`/organization`):

- Overview with member counts, certificate stats, pending requests.
- Member list with role management (invite, change role, remove).
- Join request approval/rejection workflow.
- Organization settings (name, email, description, address, phone, URL, logo upload).
- Organization switching (active org stored in cookie, UI changes to reflect new context).

**Organization deletion rules:**

- Only the org admin (membership `role === 'admin'`) can delete.
- Representatives CANNOT delete the organization.
- Deletion is blocked if the org has any certificates (in any status).

### 4. Courses

Multilingual course content authored by editors/admins via Plate.js rich text editor with AI assistance.

**Three course types:**

| Type      | Audience    | Purpose                                                  | Has assessments |
| --------- | ----------- | -------------------------------------------------------- | --------------- |
| `intro`   | All members | Introductory content about the project, not skill-linked | No              |
| `skill`   | Volunteers  | Skill-linked courses that count toward certification     | Yes             |
| `learner` | Learners    | Specific content, not tied to skills or certificates     | No              |

**Course structure:** Each course has ordered lessons. Each lesson can contain:

- Rich text content (via Plate.js)
- **Questions** (multiple choice): for self-testing within lessons
- **Evaluations** (self-assessment): rating prompts within lessons (generic, not final score)
- **Assessment** (final rating): ONE per lesson (only in skill courses, MUST be in the last step). Represents the final skill score.

**Course progression:**

- Volunteers/learners enroll in a course (records enrollment + locale preference).
- Progress tracked per lesson (binary: completed or not).
- Visual progress bar with percentage shown in course sidebar and course cards.
- Lesson completion triggers progression to next lesson.
- Assessment ratings (1 to 5) from skill courses feed into certificate eligibility.

**Publication states:** archived, draft, partial (some lessons missing content), published (all lessons have content).

### 5. Certificates

Volunteers submit certificates after completing required skill courses. Certificates are tied to a specific volunteering experience.

**Eligibility requirements:**

- Complete at least `minSkills` (3) skill-type courses.
- Average assessment rating across all completed skill courses >= `minRating` (3/5).

**Certificate fields (user-provided on creation):**

- `skillCourseIds`: which completed skill courses to include
- `language`: certificate language (en/es/it)
- `activityStartDate`, `activityEndDate`: volunteering period
- `activityDuration`: hours of volunteering
- `activityLocation`: where the volunteering took place
- `activityDescription`: description of the volunteering activity
- `organizationRating`: 1 to 5 star rating of the organization

**Status flow:**

```
submitted → in_review → approved
                      → changes_requested → (edit + resubmit) → submitted → ...
```

**Reviewer assignment:**

- Tutors are **auto-assigned** on certificate creation via load-balancing (tutor with fewest assignments in the org gets assigned).
- The auto-assigned tutor can be **changed by** the org admin, representatives, or the tutor themselves.
- Tutors can **self-assign** to certificates that have not yet been reviewed.
- ONLY tutors can review certificates. Admins and representatives manage tutor assignments but do not review directly.

**Review process:**

- Tutor opens the review form, which transitions status to `in_review`.
- Tutor can:
  - **Approve**: generates PDF, uploads to R2, sets `issuedAt`, marks `approved`. First approved cert becomes default for public profile.
  - **Request changes**: adds reviewer comment, sets `changes_requested`. Volunteer edits and resubmits.
- **Editable fields during review** (by the tutor): `activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`, plus the associated skills and their evaluation/assessment data.
- Email notifications sent at each status transition.

**Certificate resubmission (after `changes_requested`):**

- Volunteer can edit the certificate fields and resubmit, returning it to `submitted` status.
- The same reviewer is re-assigned unless manually changed.

**PDF generation:**

- Generated via `@react-pdf/renderer` on approval.
- Uploaded to Cloudflare R2 as `certificates/{handle}.pdf`.
- Must match the official template at `.agents/assets/certificate-template.pdf`: Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.
- PDF URL stored in `documentUrl` and publicly accessible.

### 6. Public certificate page

Each user has a public URL: `/{username}` (shows default certificate) or `/{username}?v={handle}` (specific certificate).

**Page content:**

- Verified badge with volunteer name and organization.
- Metrics grid: activity dates, duration, location, skills.
- Activity description.
- Issued date.
- Download button for PDF (if available).
- Social sharing: proper Open Graph and Twitter Card meta tags.
- QR code displayed on the page linking to the same URL.
- CTA section to join GloRe.

### 7. AI writing assistant

Integrated into the Plate.js rich text editor for course authoring:

- **Slash commands** (`/api/v1/ai/command`): generate, improve, summarize, translate content.
- **Copilot** (`/api/v1/ai/copilot`): next-word/next-sentence suggestions.

**Current provider:** Google Gemini (via Vercel AI SDK `@ai-sdk/google`, model: `gemini-2.0-flash`).

### 8. File storage

Cloudflare R2 (`@aws-sdk/client-s3`, S3-compatible) via `r2Put`, `r2Delete`, `r2Url` helpers in `src/lib/storage.ts`.

**Stored files:**

- User avatars (via settings UI)
- Organization logos (via org settings)
- Rich text editor media (images, files) during course authoring
- Generated certificate PDFs (publicly accessible via `documentUrl`)

### 9. Email notifications

SMTP-based (Nodemailer) transactional emails:

| Template                    | Trigger                                                  |
| --------------------------- | -------------------------------------------------------- |
| `auth/verify-email`         | After registration                                       |
| `auth/recovery`             | Password reset request                                   |
| `auth/invite`               | Organization invitation                                  |
| `team/invite`               | Team member (admin/editor) invitation                    |
| `certificate/assigned`      | Certificate auto-assigned to tutor                       |
| `certificate/review`        | Certificate approved or changes requested                |
| `organization/join-request` | Join request decision notification                       |
| `organization/member-added` | Member added to organization                             |
| `account/password-changed`  | Password changed confirmation                            |
| `account/email-changed`     | Email changed notification (to both old and new address) |

### 10. Admin panel

Platform admin dashboard (`/admin`):

- **Team management** (`/admin`): invite admin/editor team members, manage roles, resend invitations.
- **User moderation** (`/admin/users`): list all users, ban/unban, change platform roles.
- **Organization approval** (`/admin/organizations`): approve or reject pending organization requests, invite new organizations.

### 11. Dashboard

Role-aware main dashboard (`/dashboard`):

- Time-based greeting with role-specific subtitle.
- Stats grid: published courses, total lessons, skill groups, all courses.
- Course breakdown by type (intro/skill/learner) with counts and previews.

### 12. Documentation

Live-editable documentation section (`/docs`) for guides, FAQs, and tutorials. Content created by admins/editors.

**Database tables exist:** `doc_categories` (title, description, slug) and `doc_articles` (title, content, excerpt, categoryId, published, slug). All text fields use `IntlRecord` for multilingual support.

**Subsections:**

- `/docs/intro`: introduction guides
- `/docs/faq`: frequently asked questions
- `/docs/tutorials`: step-by-step tutorials

### 13. User settings

Settings page (`/settings`) with two tabs:

- **Profile**: avatar, name, bio, phone, birthday, sex, pronouns, city, country, spoken languages (35+ languages).
- **Account**: password change, email management.

### 14. Internationalization

Full i18n via next-intl (en, es, it). Locale stored in `NEXT_LOCALE` cookie. Database text fields use `IntlRecord` (JSON with locale keys). Title-case enabled for English only.

### 15. PWA

Progressive Web App with dynamic manifest (`/api/v1/manifest`), multiple display modes (TWA, Standalone, MinimalUI, Fullscreen, Browser).

---

## User flows

### Flow 1: Organization registration

1. User navigates to `/register`.
2. Fills organization details (name, email, city, country, URL) and representative info.
3. System creates organization in `pending` status with a join request.
4. Platform admin reviews and approves (or rejects) the organization from `/admin/organizations`.
5. On approval, the registrant receives a notification and can proceed to onboard.

### Flow 2: Onboarding

1. Approved user logs in. Proxy detects `onboardedAt` is null, redirects to `/onboarding`.
2. User fills: firstName, lastName, birthday, phone, locale, password.
3. `onboardedAt` is set, user redirected to `/dashboard`.
4. Onboarded user accessing `/onboarding` is redirected to `/dashboard`.

### Flow 3: Join an organization

1. **Via invitation**: user receives email invite link → visits `/api/v1/join?token=...` → token validated, user added to org.
2. **Via join request**: user submits request from the org page → representative/admin approves in org panel.

### Flow 4: Complete courses

1. Volunteer navigates to `/courses` and browses available courses (filtered by type, language, skill group).
2. Enrolls in a course (records locale preference).
3. Progresses through lessons: reads content, answers questions, submits evaluations.
4. On the last lesson of a skill course, submits the final assessment rating.
5. Marks lesson complete, progress bar updates.
6. After completing all lessons, course marked as completed.
7. After completing 3+ skill courses with avg assessment >= 3/5, certificate request becomes available.

### Flow 5: Request and receive a certificate

1. Eligible volunteer navigates to `/certificates/new`.
2. Fills form: selects skill courses, activity dates, duration, location, description, language, org rating.
3. Live PDF preview shown alongside the form.
4. Submits certificate. System auto-assigns a tutor (least-loaded in the org). Status: `submitted`.
5. Tutor receives email notification.
6. Tutor opens certificate from their review queue, transitions to `in_review`.
7. Tutor reviews and either approves (PDF generated, uploaded to R2, email sent) or requests changes (comment, email sent).
8. If changes requested: volunteer edits fields and resubmits. Cycle repeats.
9. Approved certificate appears on `/{username}` and PDF is publicly downloadable.

### Flow 6: Author a course (editor/admin)

1. Admin or editor navigates to `/courses/[slug]`.
2. Course editor opens with Plate.js rich text, lesson sidebar, and metadata header.
3. Author adds/reorders lessons, writes content, adds questions/evaluations/assessments.
4. Uses AI slash commands and copilot for content generation.
5. Saves changes. Once all lessons have content, course status becomes `published` and is visible to learners.

### Flow 7: Manage organization (admin/representative)

1. Admin or representative navigates to `/organization`.
2. Views: overview (stats, certificate counts), members, pending join requests, settings.
3. Can invite members by email, change roles, remove members.
4. Can manage tutor assignments for certificates.
5. Admin only: update org settings (name, logo, description, contact info), delete org (if no certificates).

### Flow 8: Platform administration

1. Platform admin navigates to `/admin`.
2. Team tab: invite admins/editors, manage team roles.
3. Users tab (`/admin/users`): view all users, ban/unban, change platform role.
4. Organizations tab (`/admin/organizations`): approve/reject pending orgs, invite new orgs.

---

## Data model

### Core tables

| Entity                       | Key fields                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                      | id, email, username, firstName, lastName, bio, avatar, role, isEditor, onboardedAt, locale, country, city, phone, birthday, sex, pronouns |
| `accounts`                   | userId, providerId, accountId, accessToken, refreshToken, password (Better Auth managed)                                                  |
| `sessions`                   | userId, token, expiresAt, ipAddress, userAgent (Better Auth managed)                                                                      |
| `verifications`              | identifier, value, expiresAt (Better Auth managed)                                                                                        |
| `organizations`              | id, handle, name, email, description (IntlRecord), country, city, address, phone, postcode, url, rating, avatar, region, approvedAt       |
| `memberships`                | id, userId, organizationId, role (admin/representative/tutor/learner/volunteer)                                                           |
| `organization_join_requests` | id, organizationId, email, firstName, role, status (pending/accepted/rejected), reviewedBy, message, comment                              |
| `regions`                    | id, name (IntlRecord), coordinatorId, icon                                                                                                |
| `teams`                      | id, userId, token, email, firstName, lastName, role, inviter, expiresAt, acceptedAt                                                       |

### Course tables

| Entity             | Key fields                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `courses`          | id, slug, type (intro/skill/learner), title (IntlRecord), description (IntlRecord), icon, languages, creatorId, skillGroupId, sortOrder, archivedAt |
| `skill_groups`     | id, name (IntlRecord)                                                                                                                               |
| `lessons`          | id, courseId, title (IntlRecord), content (IntlRecord), sortOrder                                                                                   |
| `contributions`    | id, lessonId, userId                                                                                                                                |
| `questions`        | id, lessonId, description (IntlRecord), explanation (IntlRecord)                                                                                    |
| `question_options` | id, questionId, content (IntlRecord), isCorrect                                                                                                     |
| `evaluations`      | id, lessonId, description (IntlRecord)                                                                                                              |
| `assessments`      | id, lessonId, description (IntlRecord)                                                                                                              |

### Progress tables

| Entity             | Key fields                            |
| ------------------ | ------------------------------------- |
| `user_courses`     | id, userId, courseId, locale          |
| `user_lessons`     | id, userId, lessonId                  |
| `user_answers`     | id, userId, optionId                  |
| `user_evaluations` | id, userId, evaluationId, value (1-5) |
| `user_assessments` | id, userId, assessmentId, value (1-5) |

### Certificate tables

| Entity               | Key fields                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `certificates`       | id, handle, userId, organizationId, language, activityStartDate, activityEndDate, activityDuration, activityLocation, activityDescription, organizationRating, reviewerId, reviewerComment, status, isDefault, documentUrl, issuedAt |
| `certificate_skills` | id, certificateId, courseId                                                                                                                                                                                                          |

### Documentation tables

| Entity           | Key fields                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `doc_categories` | id, title (IntlRecord), description (IntlRecord), slug                                          |
| `doc_articles`   | id, title (IntlRecord), content (IntlRecord), excerpt (IntlRecord), categoryId, published, slug |

### Enums

| Enum                          | Values                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `certificate_status`          | draft, submitted, in_review, changes_requested, approved |
| `course_type`                 | intro, skill, learner                                    |
| `organization_request_status` | pending, accepted, rejected                              |
| `role`                        | admin, learner, tutor, representative, volunteer         |

---

## Business rules

1. A user without `onboardedAt` cannot access any dashboard route.
2. Only `is_admin` users can access `/admin`.
3. Only `is_editor` or `is_admin` users can edit courses. Non-editors see the learner/viewer mode.
4. Certificates require at least `minSkills` (3) completed skill courses and avg assessment rating >= `minRating` (3).
5. Only one active organization per session (stored in cookie). Switching org reloads the dashboard context.
6. A certificate must be in `submitted` status before a tutor can begin review.
7. Once `approved`, a certificate is immutable and publicly visible.
8. ONLY tutors can review certificates. Admins and representatives manage tutor assignments.
9. Tutors are auto-assigned on certificate creation via load-balancing. Assignment can be changed by admin, rep, or tutor.
10. Tutors can self-assign to unreviewed certificates.
11. Each organization has exactly ONE admin (the owner). Multiple representatives are allowed.
12. Only the org admin can delete the organization. Deletion blocked if any certificates exist.
13. Certificate PDFs are publicly accessible via Cloudflare R2 URL stored in `documentUrl`.
14. All user-facing strings must go through next-intl. No hardcoded UI text.
15. All app cookies use the `gl_` prefix (configurable via `COOKIE_PREFIX` env var). Locale cookie `NEXT_LOCALE` has no prefix.
16. The certificate review form must allow editing `activityStartDate`, `activityEndDate`, `activityDuration`, `activityLocation`, `activityDescription`, and associated skills/evaluations.
17. Volunteers can edit and resubmit certificates after `changes_requested`, returning to `submitted` status.

---

## Storage

Cloudflare R2 (`@aws-sdk/client-s3`, S3-compatible):

- User avatars
- Organization logos
- Rich text editor media (course authoring)
- Certificate PDFs (publicly accessible, URL in `documentUrl`)

---

## AI integration

Rich text editor AI assistance for course authoring:

- **Slash commands** (`/api/v1/ai/command`): generate, improve, summarize, translate.
- **Copilot** (`/api/v1/ai/copilot`): next-word/next-sentence suggestions.

**Current provider:** Google Gemini (`@ai-sdk/google`, model: `gemini-2.0-flash`).

---

## Out of scope

- Real-time collaboration on course content
- Payment / subscription management
- Video hosting (embedded from external sources)
- Native mobile apps (PWA covers mobile)
- SSO / OAuth login (email/password only)

---

## Open questions

1. Should the review form allow tutors to directly edit certificate fields, or should tutors only be able to request changes with comments? (Current: comments only. Spec says: direct field editing required.)
2. Should certificates include evaluation/assessment data in the PDF, or only skill names?
3. Should the QR code on the public certificate page link to the PDF or the web page?
4. What R2 bucket policy for public vs private files? Certificate PDFs must be public.
5. Should the docs section support user comments or just admin-authored content?
6. Should learners have any path to certificate eligibility, or is it strictly volunteers only?
