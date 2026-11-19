# Certificates

Certificate lifecycle, screens, PDF, and public verification. Roles and the other domain rules: `app.md`.

## Lifecycle

### Eligibility

- A volunteer can request a certificate after completing at least `minSkills` (3) skill courses.
- Nothing else gates eligibility: there is no rating threshold (`minRating` is gone).
- The final assessment of each skill course is a blind choice among its three level descriptions (`skill-choice.ts`). The volunteer never sees a level name, dots, or an average before issue.

### Status flow

```
draft -> submitted -> in_review -> approved -> revoked
         submitted | in_review -> changes_requested -> (resubmit) -> submitted
         open status -> withdrawn (volunteer) | rejected (assigned tutor, terminal)
```

- Open statuses are `submitted`, `in_review`, and `changes_requested`.
- A user has at most one open request per organization (D4). Approved certificates stack for new periods.
- Every transition runs through `src/actions/certificates/{requests,assignment,review}.ts`.
- Every transition records an `activity_events` row in the same transaction and calls `notify`.

### Request

- Only a `volunteer` of the active org creates drafts (up to 5) and submits.
- Submit validates 1 to 4 tasks of at most 110 characters and 3 to 4 completed skill courses (checked fresh).
- Submit also validates the experience rating and eligibility (D8).
- Submit also validates the activity rule: 100 hours, or an end date three months after the start (error `ACTIVITY_TOO_SHORT`).
- Submit also validates the personal data: last name, birthday, birth place, nationality. The volunteer may fill them inline (error `PERSONAL_DATA_MISSING`).
- The server derives each skill's `selfLevel` from the stored course choice (`findHolderLevels`) and ignores any level the client sends.
- Submit generates the public `code` and keeps it on resubmit. The code is Crockford base32 `XXXX-XXXX-XXXX` (`rules.ts`), and certificates never expire.

### Reviewer assignment

- Submit and resubmit auto-assign the org tutor with the fewest open requests, ties to the oldest last assignment (never assigned counts as oldest).
- Authors and banned users are skipped. An org without tutors leaves the request in the pool.
- Resubmit keeps the reviewer while still assignable.
- Org admins, representatives, and platform admins assign, reassign, and unassign. The assigned tutor can release, then returns to `/certificates`. A released `changes_requested` request gets a tutor again on resubmit.
- An `in_review` request goes back to `submitted` when its tutor changes. `changes_requested` keeps its status.
- Tutors self-assign unassigned `submitted` requests of their org.
- The tutor queue is scoped to the active org. Drafts are visible to their owner only.
- ONLY tutors review. Admins and representatives manage assignment but never review directly.
- Demoting, removing, or losing a tutor returns open reviews to the pool (`certificate.unassigned`).

### Review

- The assigned tutor claims the request (`in_review`), requests changes (section comments stored on the review row), rejects, or approves.
- Reject needs a reason of 10 or more characters and works from any open status.
- Approval merges the tutor's edits, requires a level and its description on 3 to 4 skills (a missing description fails with `INVALID_INPUT`), rechecks the activity rule, and renders the PDF.
- Approval commits the status, review row, and event in one transaction, then uploads to R2.
- An upload failure reverts the whole approval and returns `STORAGE_FAILED`. The certificate caches expire even when the revert fails too.
- The first approved certificate becomes the default on the public profile.
- A holder has at most one default, enforced by the partial unique index `certificates_user_id_default_key`.
- Approval, featuring, and revocation first take the per-holder advisory lock `certificate-default:<userId>`, so racing writes queue instead of failing.
- Org managers and platform admins revoke an approved certificate with a reason of 10 or more characters.
- Revocation clears `documentUrl` in its transaction and deletes the PDF object from R2 after the commit (`r2DeleteQuietly`), and the latest approved certificate becomes the default.
- A failed delete is logged and never undoes the revoke. The orphan sweeper removes the object later, because it treats the PDF of a revoked certificate as unreferenced.

### Blind level choice

- Levels are the `skill_level` enum: `intermediate`, `good`, `advanced`. There is no lower level and no "none of these" option.
- The last lesson of a skill course shows the three descriptions of the course as an accessible radio group. Cards carry opaque HMAC ids (`skillChoiceToken`) sorted by id, so the order says nothing about the level. The choice is final.
- The server resolves the token to a level (`resolveSkillChoice`) and stores it in `user_assessments.value`. A level sent by the client is ignored.
- `parseCertificate` nulls `level` and `selfLevel` until the certificate is `approved` or `revoked`. Tutor changes stay hidden until issue.
- A published skill course without all three descriptions shows "descriptions missing" in its final step, and the editor refuses to publish it (`DESCRIPTIONS_MISSING`).
- The snapshot keeps the description in every locale. Old snapshots keep numeric levels and `statement`, and `renderSnapshotSkill` renders both.
- Committed guards: `skill-choice.test.ts`, `db/queries/certificate.test.ts`, and the blind cases in `queries.test.ts` and `learning.test.ts`.

## Screens

### Request wizard

- Route: `/certificates/new`, for volunteers of the active org.
- Experience: dates, hours, location, 1 to 4 tasks of 110 characters.
- Skills: 3 to 4 completed skill courses. The chosen description is shown read-only (the choice in the course is final), with no level name, and the reflection is prefilled as evidence.
- Your organization: anonymous rating, shown to the org only as an aggregate of 3 or more.
  - Fields: `experience`, `support`, `certificationSupport` (1 to 5), `wouldRecommend`, and a `comment` of up to 400 characters.
- Review: language from the UI locale, missing personal data inline, live `CertificateThumbnail`.
- One column in a centered card. A toolbar above it holds the stepper (phones: "Step N of 4" and a progress bar), the save status, Save and exit, and an overflow menu with Discard draft. Review is a check-your-answers list with a Change button per row, then the live thumbnail, language, and missing personal data. The footer hides Back on step 1, and sticks to the bottom on phones.
- Drafts autosave through `saveCertificateDraft` only after the volunteer edits a field, so opening the wizard never creates a draft. Hitting the 5 draft cap shows a dedicated message. `?draft=<id>` resumes a draft on its first incomplete step (`resumeStep`).
- A `changes_requested` id opens the same wizard in resubmit mode with the tutor's comments.
- `EligibilityPanel` replaces the wizard when eligibility fails or a request is already open.

### Wallet

- Route: `/certificates`, for volunteers.
- A `DataTable` with the `FilterRail` (status and organization facets with counts, search by organization or code). Columns: certificate (second line: draft step, period and hours, or revoked date), organization, status, code, one action (Continue for drafts, Open otherwise).
- Rows sort as drafts, open requests, the featured certificate, other issued, revoked. The featured (`isDefault`) approved certificate is a star marker in its row, not a card.
- The band holds the Request certificate button, hidden when an open request exists or the volunteer is not eligible.
- `EligibilityPanel` replaces the page when nothing exists and the volunteer is not eligible.
- `featureCertificate` moves the flag between approved certificates.
- The list filters by status (only statuses that exist) and sort in a `FilterBar`.

### Detail

- Route: `/certificates/[id]`.
- The band shows the status dot, the organization, and one primary action by status and role. Withdraw, make featured, and revoke sit in a More actions menu. A revoked, rejected, or withdrawn request offers Request a new certificate.
- Main column: `CertificateJourney` with the date of each reached stage (`journeyDates`), `CertificateFeedback` (revocation reasons use a neutral card), the preview (none when revoked), skills, tasks, and the timeline from `findCertificateActivity`.
- A 320 px right rail holds Details, `CertificateShare` (owner and approved only), and the reviewer row. On phones the rail stacks after the preview.
- `CertificateShare`: verify link with one Copy button, QR, LinkedIn "Add to profile" link, LinkedIn and Facebook share, and native share.
- The owner also gets a one-time confetti per certificate (`localStorage` flag).

### Tutor queue

- Route: `/certificates`, for tutors.
- One `DataTable` with the `FilterRail`. The Queue facet (with counts) selects assigned to me (open), unassigned (org pool, self-claim), or completed. The band holds Start next review, which opens the oldest assigned request.
- Search and the status and waiting-time filters are nuqs params (`tab`, `q`, `status`, `age`) in a `FilterBar` with Clear filters. `/` focuses the search.
- A filtered empty table shows its own "No matches" state.
- Claim is optimistic: the row leaves the unassigned tab at once and returns with an error toast if the claim fails. The unassigned tab uses `DataTable` row selection: selected rows show a count and a "Claim N reviews" bulk action, and the table announces the count. The organization table shows a skeleton while it loads.
- The age badge (`StatusBadge`: neutral, then warning at 3 days, danger at 7, `reviewReminderDays`) counts days since `submittedAt`.
- `changes_requested` rows show "waiting for volunteer".

### Review workspace

- Route: `/certificates/[id]/review`, for the assigned tutor only.
- Left side: the previous feedback (neutral card), the volunteer, experience and tasks (read-only, with an Edit button that opens the fields in place), and skills with the chosen description, evidence, and the reflection (`findReviewContext`, reviewer only).
- The band shows the status and "Submitted N days ago" as text, and Start review for a `submitted` request.
- Right side, a sticky 400 px "Your review" panel (wider than the 320 px rail because it holds inputs): per-skill include and a radio group of the three descriptions with their level names (the volunteer's choice is marked; picking another changes the level; no statement), four blind scores, a general comment, collapsible notes per section, then Approve, Request changes, and Reject. A `changes_requested` request replaces the panel with a waiting note.
- Approve first renders the real PDF with `previewCertificatePdf` (persists nothing) in a dialog, then calls `approveCertificate`. On coarse pointers the dialog shows the HTML `CertificateThumbnail` built from the form values, plus an Open PDF link to the blob, because iOS Safari renders `<object>` PDFs poorly (`useCoarsePointer`). Desktop keeps the `<object>` embed.
- Below `lg`, the panel follows the evidence, and a fixed bottom bar holds Approve.
- Request changes needs a general comment or a section note. Reject needs a reason of at least 10 characters.
- `Start review` (`StartReviewButton` in the band) claims a `submitted` request.

### Organization pipeline

- `OrganizationCertificates` (in `features/certificates`) shows four `StatCard`s: submitted, in review, changes requested, approved.
- It has search and status and reviewer filters held in local state (no URL params, so it can sit in a tab).
- It has a `DataTable` with reassign, revoke, and view per row.
- Props: `certificates` from `listOrganizationCertificates(orgId)` (non-draft; org admins, representatives, and platform admins only) and `tutors` from `listOrgTutors(orgId)`.
- `/certificates` mounts it for the active org's admins and representatives.
- The organization tab and `/admin/certificates?org=ID` embed it through `OrganizationCertificatesPanel`.
- Platform admins reach `/certificates/[id]`, because the `canEdit` guard in the route layout lets admins through. `/certificates` redirects them to `/admin/certificates`.

### Forms

- Form errors are `CertificateErrors` codes set as zod messages and rendered by `FieldError`.
- `new/values.ts` maps form values to `CertificateEditValues` and back, and drops blank tasks.
- Show unset activity dates as `-` through `formatActivityDate` and `formatActivityPeriod` (`certificates/rules.ts`), because a draft can store `""` dates.

## PDF

- The PDF is generated on approval and stored at `certificates/{handle}.pdf` in R2, public through `documentUrl`.
- `/api/v1/certificates/<id>/pdf` re-renders on demand for signed-in users and is limited to 30 requests a minute per IP (`certificate-pdf:<ip>`, answers 429).
- `@react-pdf/renderer` renders it from the A4 template (Roboto, navy and green tokens, vector logo, `DD.MM.YYYY` dates).
- Every certificate keeps the Erasmus+ footer in every language. The labels follow the certificate language.
- It holds a QR code and short URL pointing to `/verify/<code>`, plus the signatory block.
- The template reference and fidelity checks are in `.agents/references/certificate-pdf.md`.

## Public verification

- `/verify` takes a code (any case, dashes optional, normalized by `normalizeCertificateCode`) and redirects to `/verify/<code>`.
- `/verify/<code>` renders one credential card led by the verdict row (valid or revoked with its date, Download PDF as a secondary button), then the holder, facts, tasks and skills in two columns, and a footer with code, issue date, signatory, and QR. A "Check another code" field sits above the card. A revoked card keeps only holder, organization, code, and issue date. The public profile keeps the band card.
- `/verify/<code>` shows the holder's full name, organization and logo, period, hours, location, tasks, skills with their level and description, issue date, signatory, PDF link, QR, an Open Graph image, and JSON-LD (always serialized with `serializeJsonLd`, which escapes `<` so a holder name cannot close the script element).
- Both routes are public, `noindex`, and rate limited per IP (60 checks and 30 lookups a minute).
- The verification image (`verify/[code]/opengraph-image.tsx`) reads through `verifyCertificate`, so it shares the 60 checks a minute and answers 429 with `retry-after` when limited.
- `findPublicCertificate` (the `/{username}` page, its metadata, and its image) is limited to 60 reads a minute per IP under `profile:<ip>`, deduped per request. The image answers 429 and the page answers not found.
- `lookupLegacyCertificateCode` applies the 30 lookups a minute limiter to the `?v=` redirect.
- An approved certificate reads `valid`. Every other status is `unknown`.
- A revoked certificate reads `revoked` with its date and shows only the holder, organization, code, and issue date.
- A revoked certificate never exposes its reason, PDF link, location, dates, duration, tasks, skills, signatory, or QR. `/api/v1/certificates/<id>/pdf` answers 410.
- The page reads the issued `snapshot`, so later profile edits never change it.
- Approval freezes the `CertificatePdf` labels in `snapshot.labels`, so later message overrides never change an issued PDF.
- A snapshot without `labels` renders with the current messages.
- `/{username}` is opt-in (`users.publicProfile`, default off) and shows the featured certificate.
- A private profile renders the not-found page. It streams with status 200 and `noindex`, so it looks like an unknown user.
- The legacy `/{username}?v={handle}` permanently redirects to `/verify/<code>`.

## Account deletion

- `eraseAccount` (`deleteUser` in `db/mutations/user.ts`) deletes the holder's drafts and open requests.
- In the same transaction it detaches every issued (`approved` or `revoked`) certificate instead of deleting it.
- Detaching sets `user_id` to null, sets `holder_deleted_at` (a dedicated marker, so `revoked` keeps meaning an organization decision), and clears `is_default`. Nothing else changes.
- The row keeps its `snapshot`, description, location, tasks, skills with `evidence`, review comments, rating, event metadata, and `documentUrl`.
- The certificate therefore stays valid, and organization stats and tutor history still count it.
- Open reviews of a deleted tutor return to the pool in the same transaction (`in_review` goes back to `submitted`, `certificate.unassigned` is recorded) through `releaseTutorAssignments`.
- `settleDeletedUser` deletes the avatar, expires the certificate caches of every affected organization and reviewer, the organizations and team caches and the admin overview, then notifies the unassign events.

### Detached certificate behavior

- `/verify/<code>` renders a detached certificate like any other from its `snapshot` (no snapshot and no user means unknown).
- It adds a neutral "no longer has a GloRe account" note from `ActiveVerification.holderDeleted`. The legacy `?v=` link still redirects there.
- `parseCertificate` exposes `holder` (the user, else the snapshot name) and `isHolderDeleted`.
- `OrganizationCertificates` shows that name with "No longer on GloRe" and keeps the view and revoke actions. `CertificateDetail` shows the same label as a header badge.
- Organization managers, platform admins, and the former reviewer can open the detail page and the PDF (`canViewCertificate`). `certificatePdf` renders from the snapshot.
- The tutor queue and global search skip it. The review context and lifecycle actions refuse it (`findCertificateRow` and `transition` need a holder).
- Managers and platform admins can still revoke an approved one (`requireManagedCertificate`, `recordCertificateRevocation`). No holder is notified, because `certificate.revoked` carries `holderId: null`.
- `/admin/certificates` left-joins users and also searches the snapshot name.
- Code that reads `certificates.userId` MUST treat null as a former holder.

## State change rule

- Certificate state changes go through `certificateAction` and `commitTransition` in `@/actions/certificates/helpers`: guard, transaction, `recordEvent`, then `notify`.
- Approval alone renders the PDF and uploads to R2 after its transaction, and reverts the approval on failure.
