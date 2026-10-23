# Platform admin area

- Only `isAdmin` users reach `/admin`. The admin layout answers not found for everyone else.
- Every action behind it calls `requireAdmin()` (`actions/admin/helpers.ts`), which reads a fresh session (cookie cache off) and rejects banned and non-admin users.
- Writes use `requireAdminWithLimit(action, max)` (per admin per hour).
- `adminAction()` returns `{ data, error: { code, message } }`. The client maps `code` to `Admin.errors` with `useAdminError`.
- The organization actions in `actions/admin/organizations.ts` (read, approve, reject, create, invite) follow the same rule, never `isAdmin` from `getCurrentUser`. Writes validate `db/queries/admin-organization.ts` schemas (ids, review comment, create and invite input with an `http` or `https` website) and answer `INVALID_INPUT` on a bad value.

## Users

- `/admin/users` is server paged (20 per page).
- `listAdminUsers` validates `adminUsersQuerySchema` (`db/queries/admin-user.ts`): search tokens over name, email, and username, plus role, status (active or pending), ban state, organization, and page.
- URL params (`users-params.ts`, nuqs): `q`, `role`, `status`, `banned`, `org`, `page`.
- The page reads `searchParams` with `createSearchParamsCache`. The client uses `useQueryStates` with `shallow: false` and a debounced search.
- `DataTable` runs in server mode through its `pagination` prop.
- `banUser` requires a reason (trimmed, 10 to 500 characters, `adminReasonSchema`) and accepts a future expiry.
- `suspendAccount` (`db/mutations/moderation.ts`) sets the ban, deletes the user's sessions, and records `account.suspended` in one transaction.
- Platform admins (`TARGET_IS_ADMIN`) and the acting admin (`SELF`) cannot be banned.
- `unbanUser` records `account.reinstated`.
- Better Auth lifts an expired ban at the next sign in. Lists treat an expired ban as not banned (`isBanActive`).
- `updateUserRole` calls `setPlatformRole` (advisory lock, `LAST_ADMIN` guard, no self change) and records `team.role_changed`.

## Team

- `/admin/team` lists admins and editors.
- `inviteTeamMember` creates the account with a random password (`signUpEmail`; `autoSignIn` stays `false`) and sets the platform role.
- It then calls `createTeamInvitation` (`db/mutations/team-invitation.ts`): a 32 byte `base64url` token valid for `invitationExpiryDays`, stored only as its SHA-256 `tokenHash`, and a `team.invited` event.
- `resendInvitation` calls `refreshTeamInvitation`, which locks the latest invitation without `acceptedAt`.
- It refuses a send within 60 seconds of the last one (`TOO_SOON`, measured on `updated_at`).
- It replaces the token, so the old link stops working, and replaces the expiry, so expired invitations come back to life. It records `team.invited`.
- Both paths send through `notify(event)` and the `team/invite` template.
- Zero delivered emails raise `SEND_FAILED` and keep the refreshed token.
- Tokens never reach payloads: `url` and `email` are in `PRIVATE_KEYS`, and the actions return only the email and the expiry.
- Role changes reuse `setPlatformRole`. Removal refuses the acting admin.
- `deleteTeamMember` accepts only a platform admin or editor (`NOT_FOUND` otherwise) and runs `eraseAccount` with the acting admin: the `SOLE_ORG_ADMIN` guard applies and `account.deleted` is recorded with the admin as actor. The removed person gets no "as you asked" mail.

## Certificates

- `/admin/certificates` is a server paged lookup (20 per page) over every non-draft certificate.
- `searchAdminCertificates` validates `adminCertificatesQuerySchema` (`db/queries/admin-certificate.ts`).
- A query that `normalizeCertificateCode` accepts (any case, with or without dashes) is an exact code match.
- Otherwise each token must match the code, the holder name (the snapshot name when the holder deleted the account), the holder email, or the organization name.
- Rows sort by `coalesce(submittedAt, createdAt)` descending.
- URL params (`certificates-params.ts`): `q`, `status`, `org`, `page`.
- Row actions: view (`/certificates/[id]`, open to platform admins) and revoke for approved certificates.
- Revoke goes through `ReasonDialog` and `revokeCertificate` (reason, `certificate.revoked` event, learner notice).
- Choosing an organization (`?org=ID`, or the organization name in a row) swaps the table for `OrganizationCertificatesPanel`.
- That panel is the same pipeline the organization tab shows: `OrganizationCertificates` with reassign, revoke, and view.
- It loads on demand through `listOrganizationCertificates(orgId)` and `listOrgTutors(orgId)`, both of which accept platform admins.
- `/certificates` redirects platform admins to `/admin/certificates`.

## Legal documents

- `/legal` (`canEdit`, outside the admin layout) manages `privacy`, `terms`, and `quality-charter` through `actions/legal/manage.ts`: one draft per document, per-locale edits, history.
- Editors draft and edit. Only platform admins publish, with an effective date, a change note, and a material flag that counts for `terms` only.
- Publish needs all three locales with matching headings (`INCOMPLETE`, `HEADINGS_DIFFER`). A published version never changes.
- Mutations live in `db/mutations/legal.ts`, and they expire the `legalTag(slug)` cache and record the audit events.

## Audit

- `/admin/audit` is a server paged log (25 per page, newest first) of `activity_events` limited to `AUDITED_ACTIONS` (`db/queries/admin-audit.ts`).
- It orders by id, so seeded back-dated events sort after newer ones.
- Categories and their events:
  - moderation: `account.suspended`, `account.reinstated`.
  - access: `team.invited`, `team.role_changed`.
  - impersonation: `impersonation.started`, `impersonation.stopped`.
  - certificates: `certificate.revoked`.
  - organizations: `organization.application_decided`.
  - legal: `legal.version_published`, `legal.accepted`.
  - messages: `messages.published`, `messages.reset`. The target is the key and locale, linking to `/translations?q=<key>`.
- To audit a new action, add the event to `AUDIT_ACTIONS`, an `Admin.audit.events.<action with dots as underscores>` message, and an entry in `EVENT_KEYS` (`audit.tsx`).

### Search and rows

- `listAdminAudit` validates `adminAuditQuerySchema`: `category`, `from` and `to` (`YYYY-MM-DD`, whole UTC days), `q`, and `page`.
- Each search token must match the actor or the affected person (name or email, joined through `metadata.userId` or `holderId`), the organization name, or the applicant name.
- URL params (`audit-params.ts`): `q`, `category`, `from`, `to`, `page`.
- `toAuditRows` is pure. It resolves the actor, the target (user, certificate code, organization) with a link, the organization, and the reason, comment, role, or expiry from the payload.
- A removed actor account renders as `unknownPerson`.
- Payloads never hold emails, URLs, or tokens (`PRIVATE_KEYS`).

## Overview

- `/admin` (`app/(dashboard)/admin/page.tsx`) replaces the old redirect to `/admin/team` and is the first `admin` navigation entry (`admin-overview`).
- The page awaits `getAdminOverview()` inside `DashboardPage` with `AdminOverviewSkeleton` as the fallback.
- A failed read renders `AdminOverviewError` (alert banner with a refresh retry).

### Page

- `AdminOverview` (`features/admin/overview.tsx`, server rendered, `Admin.overview` messages) shows four `StatCard`s: users, organizations, certificate requests, and awaiting review with the overdue count.
- It shows two lazy `Chart`s over the 12 months: users and organizations as lines, submitted and approved certificates as bars. An all-zero series passes empty data so the chart shows its empty state.
- It shows `AdminOverviewPipeline` (status badges with share bars) and review time (average and median, hours below 48 then days; helpers in `overview-utils.ts`).
- It shows `AdminOverviewShortcuts`: users, `organizations?tab=pending` with the pending count, certificates with the waiting count, and audit.

### Data and cache

- `getAdminOverview()` (`actions/admin/overview.ts`) is admin gated, returns the `adminAction` shape, and wraps one `'use cache'` query tagged `CacheTag.AdminOverview` with `cacheLife('minutes')`.
- `expireOrganizations`, `expireTeam`, and `expireAdminOverview` (`actions/admin/expire.ts`, `updateTag`) expire it.
- The application queue, sidebar pending counts, and overview therefore read fresh after a registration, an approval or rejection, an onboarding, a team change, or any certificate transition (`expireCertificateCaches`).
- The payload (`AdminOverview`, `db/queries/admin-overview.ts`) holds `users`: total, admins, editors, pending onboarding, active bans.
- It holds `organizations`: active, pending, rejected. Pending and rejected follow the sidebar badge rule: `approvedAt` null and no rejected admin join request.
- It holds `certificates`: `pipeline` by status without drafts, `drafts`, `total`.
- It holds `monthly`: 12 UTC months of users joined, organizations registered and approved, certificates submitted and approved.
- It holds `review`: average and median hours from `submittedAt` to `reviewedAt`, overall and per month of `reviewedAt`.
- It also holds `waiting` for `submitted` and `in_review` requests, and `overdue` past the longest `reviewReminderDays`.
- Month helpers, rounding, and zero filling are pure (`toOverviewMonthly`, `toReviewMonthly`, `roundHours`).
- Charts load the shadcn `Chart` lazily (D17).

## Impersonation (D18)

### Setup

- Impersonation uses the stock Better Auth `admin()` plugin (`impersonateUser`, `stopImpersonating`).
- It runs with `allowImpersonatingAdmins: false` and `impersonationSessionDuration` from `impersonationMinutes` in `config/app.json` (15).
- The stock session carries `sessions.impersonated_by` (migration 0024, FK to `users.id`, cascade, so deleting the admin ends the session).
- A signed `admin_session` cookie holds the admin token.
- `isClosedAuthPath` closes `/api/auth/admin/*`, so only the actions in `actions/admin/impersonation.ts` start or stop impersonation.

### Start and stop

- `startImpersonation` rate limits, then runs `requireAdmin`, validates the reason, and calls `assertCanImpersonate` (`db/mutations/impersonation.ts`).
- `assertCanImpersonate` checks: target exists, is not the admin, is not an admin, is not banned, and is onboarded. It raises `ALREADY_IMPERSONATING` while a session is active.
- After the stock call it records `impersonation.started` (reason, session id, expiry).
- A failed audit undoes the start with the stock stop on the new cookies (sign out as the fallback), so the admin keeps the admin session.
- `stopImpersonation` reads the live session (`readImpersonation`), records `impersonation.stopped` with the start reason, then calls the stock stop.
- A failed audit keeps the session so the stop can be retried.
- A failed restore (admin session gone) signs the impersonation session out.
- The next request deletes an expired session, so stop then answers `NOT_IMPERSONATING` and the admin signs in again. `ImpersonationNotice` therefore stops 3 seconds before the expiry.
- Signing out drops the admin cookie.

### Guards and banner

- While `session.impersonatedBy` is set, the `impersonationGuard` plugin (`lib/impersonation-guard.ts`) answers `NOT_ALLOWED_WHILE_IMPERSONATING`.
- It blocks change email, change password, delete user, link and unlink account, set password, and session revocation.
- `deleteAccount`, `revokeSession`, and `revokeOtherSessions` check `isImpersonating()`.
- These actions are locked too: `changePassword`, `updateAccount` (a username or email change, locale stays open), `updatePrivacy`, `featureCertificate`, `transferOrganizationOwnership`, `deleteOrganization`, and `revokeCertificate`.
- They call `impersonationLocked()` (returns the error) or `assertNotImpersonating()` (throws it) from `actions/admin/impersonation-state.ts`. `queryError` turns the thrown error into the `NOT_ALLOWED_WHILE_IMPERSONATING` code (`IMPERSONATION_LOCKED`), and `useActionError` (`hooks/use-action-error.ts`) shows `Common.impersonationLocked`.
- The UI mirrors every lock. `(dashboard)/layout.tsx` passes `impersonating` (from `getImpersonation()`) to `SessionProvider`, and `useSession().impersonating` disables the triggers: password form, email and username fields, session revoke buttons, privacy switches, featured and revoke certificate buttons, ownership transfer, organization deletion, and account deletion. `ImpersonationLockNote` shows `Common.impersonationLocked` once per surface. The server locks stay the source of truth.
- A new action that changes credentials, identity, public exposure, ownership, or issued certificates MUST call one of them first.
- `/admin` answers not found because the target is not an admin.
- `ImpersonationBanner` (server, mounted once in `(dashboard)/layout.tsx`) reads `getImpersonation()` from `actions/admin/impersonation-state.ts`.
- That read returns the session's `impersonatedBy`, the expiry, and the reason from the start event.
- The banner renders `ImpersonationNotice`: a fixed bottom pill with the name, reason, countdown, a stop button, and the automatic stop.
- Start and stop hard navigate with `window.location.assign`.

### Limits

- Impersonation is not read-only. Only the locked actions above refuse. Everything else the user can do stays open (profile edits, notification preferences, course progress, certificate drafts and requests, member and invitation management for an org admin), so the support reason in the start event is the control.
- The Better Auth cookie cache (5 minutes) keeps serving a session deleted in the database, so a closed impersonation can linger in the browser for up to 5 minutes. The expiry is embedded in the cache and exact.
- Events written while impersonating name the impersonated user as actor. Only start and stop carry the admin.

## Translations

- `/translations` (`app/(dashboard)/translations/page.tsx`) edits interface text. It sits outside the admin layout because editors reach it, as `/emails` does.
- `/admin/translations` redirects to it (`next.config.ts`). The nav entry `admin-translations` (group `admin`, `visible: isTeam`) sits before `admin-emails`.
- `loadTranslations` (`actions/translations.ts`) calls `authorizeEditor`, then returns the three bundled catalogs and every override. `maxDuration` is 60.
- The table (`features/translations/`) is a real `<table>` virtualized with `@tanstack/react-virtual`: one row per `en` key, a cell per locale, and state badges.
- URL params (`translations-params.ts`): `filter`, `key` (opens the editor sheet), `namespace`, `q`.
- Filters (`TRANSLATION_STATES`): missing, overridden, outdated, incompatible, orphaned, unreviewed. Rows, filters, and counts are pure helpers in `lib/translation-table.ts`.

### Editing

- `LocaleEditor` validates as you type with `validateOverride` (`lib/message-validation.ts`, client-safe) and previews ICU through `lib/message-preview.ts`.
- Save draft, publish, discard, and reset live in `actions/messages.ts`, with shared guards in `actions/message-helpers.ts`. `listMessageHistory` returns 30 revisions.
- Protected namespaces (`PROTECTED_NAMESPACES`) need `requireAdmin` on the server and show "Admins only" to editors.
- Deleting an override whose key left the `en` bundle (orphaned) is admin only.
- `suggestMessage` drafts `es` and `it` text with the AI chain (`lib/message-suggestion.ts`). It needs `GEMINI_API_KEY`, allows 40 calls per hour per user, saves origin `machine`, and never publishes.
- A suggestion that fails `validateOverride` is dropped with `AI_INCOMPATIBLE`, `AI_INVALID`, or `AI_EMPTY`.
- All page copy is in the `Translations` namespace.

### Stale override notice

- Daily maintenance runs `notifyStaleOverrides` (`actions/maintenance/stale-overrides.ts`). It counts incompatible and orphaned overrides and records `messages.stale` for platform admins, in-app only.
- It repeats only when the counts change or after 7 days, and links to `/translations?filter=orphaned` or `incompatible`.
