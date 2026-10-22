# Platform admin area

Only `isAdmin` users reach `/admin`; the admin layout answers not found for everyone else. Every action behind it calls `requireAdmin()` (`actions/admin/helpers.ts`), which reads a fresh session (cookie cache off) and rejects banned and non-admin users. Writes use `requireAdminWithLimit(action, max)` (per admin per hour). `adminAction()` returns `{ data, error: { code, message } }`; the client maps `code` to `Admin.errors` with `useAdminError`.

## Users

- `/admin/users` is server paged (20 per page). `listAdminUsers` validates `adminUsersQuerySchema` (`db/queries/admin-user.ts`): search tokens over name, email, and username, role, status (active or pending), ban state, organization, page. URL params (`users-params.ts`, nuqs): `q`, `role`, `status`, `banned`, `org`, `page`. The page reads `searchParams` with `createSearchParamsCache`; the client uses `useQueryStates` with `shallow: false` and a debounced search. `DataTable` runs in server mode through its `pagination` prop.
- `banUser` requires a reason (trimmed, 10 to 500 characters, `adminReasonSchema`) and accepts a future expiry. `suspendAccount` (`db/mutations/moderation.ts`) sets the ban, deletes the user's sessions, and records `account.suspended` in one transaction. Platform admins (`TARGET_IS_ADMIN`) and the acting admin (`SELF`) cannot be banned. `unbanUser` records `account.reinstated`. Better Auth lifts an expired ban at the next sign in; lists treat an expired ban as not banned (`isBanActive`).
- `updateUserRole` calls `setPlatformRole` (advisory lock, `LAST_ADMIN` guard, no self change) and records `team.role_changed`.

## Team

- `/admin/team` lists admins and editors. `inviteTeamMember` creates the account with a random password (`signUpEmail`; `autoSignIn` stays `false`), sets the platform role, and calls `createTeamInvitation` (`db/mutations/team-invitation.ts`): a 32 byte `base64url` token valid for `invitationExpiryDays` and a `team.invited` event.
- `resendInvitation` calls `refreshTeamInvitation`: it locks the latest invitation without `acceptedAt`, refuses a send within 60 seconds of the last one (`TOO_SOON`, measured on `updated_at`), replaces the token (the old link stops working) and the expiry (expired invitations come back to life), and records `team.invited`.
- Both send through `notify(event)` and the `team/invite` template; zero delivered emails raise `SEND_FAILED` and keep the refreshed token. Tokens never reach payloads: `url` and `email` are in `PRIVATE_KEYS` and the actions return only the email and the expiry.
- Role changes reuse `setPlatformRole`; removal refuses the acting admin.

## Certificates

- `/admin/certificates` is a server paged lookup (20 per page) over every non-draft certificate. `searchAdminCertificates` validates `adminCertificatesQuerySchema` (`db/queries/admin-certificate.ts`): a query that `normalizeCertificateCode` accepts (any case, with or without dashes) is an exact code match; otherwise each token must match the code, holder name, holder email, or organization name. Rows sort by `coalesce(submittedAt, createdAt)` descending. URL params (`certificates-params.ts`): `q`, `status`, `org`, `page`.
- Row actions: view (`/certificates/[id]`, open to platform admins) and revoke for approved certificates through `ReasonDialog` and `revokeCertificate` (reason, `certificate.revoked` event, learner notice).
- Choosing an organization (`?org=ID`, or the organization name in a row) swaps the table for `OrganizationCertificatesPanel`, the same pipeline the organization tab shows: `OrganizationCertificates` with reassign, revoke, and view, loaded on demand through `listOrganizationCertificates(orgId)` and `listOrgTutors(orgId)` (both accept platform admins). `/certificates` redirects platform admins here.

## Audit

- `/admin/audit` is a server paged log (25 per page, newest first) of `activity_events` limited to `AUDITED_ACTIONS` (`db/queries/admin-audit.ts`), grouped in categories: moderation (`account.suspended`, `account.reinstated`), access (`team.invited`, `team.role_changed`), impersonation (`impersonation.started`, `impersonation.stopped`), certificates (`certificate.revoked`), and organizations (`organization.application_decided`). Add an event to `AUDIT_ACTIONS`, an `Admin.audit.events.<action with dots as underscores>` message, and an entry in `EVENT_KEYS` (`audit.tsx`) to audit a new action.
- `listAdminAudit` validates `adminAuditQuerySchema`: `category`, `from` and `to` (`YYYY-MM-DD`, whole UTC days), `q`, `page`. Each search token must match the actor or the affected person (name or email, joined through `metadata.userId` or `holderId`), the organization name, or the applicant name. URL params (`audit-params.ts`): `q`, `category`, `from`, `to`, `page`.
- `toAuditRows` is pure: it resolves the actor, the target (user, certificate code, organization) with a link, the organization, and the reason, comment, role, or expiry from the payload. A removed actor account renders as `unknownPerson`. Payloads never hold emails, URLs, or tokens (`PRIVATE_KEYS`).

## Overview data

- `getAdminOverview()` (`actions/admin/overview.ts`) feeds the `/admin` overview (F4). It is admin gated, returns the `adminAction` shape, and wraps one `'use cache'` query tagged `CacheTag.AdminOverview` with `cacheLife('minutes')`; `revalidateUserAccess` also revalidates the tag.
- The payload (`AdminOverview`, `db/queries/admin-overview.ts`): `users` (total, admins, editors, pending onboarding, active bans), `organizations` (active, pending, rejected; pending and rejected follow the sidebar badge rule: `approvedAt` null and no rejected admin join request), `certificates` (`pipeline` by status without drafts, `drafts`, `total`), `monthly` (12 UTC months of users joined, organizations registered and approved, certificates submitted and approved), and `review` (average and median hours from `submittedAt` to `reviewedAt`, overall and per month of `reviewedAt`, plus `waiting` for `submitted` and `in_review` requests and `overdue` past the longest `reviewReminderDays`).
- Month helpers, rounding, and zero filling are pure (`toOverviewMonthly`, `toReviewMonthly`, `roundHours`). Charts load the shadcn `Chart` lazily (D17).

## Impersonation (D18)

- The local plugin `lib/impersonation.ts` replaces the stock admin plugin `impersonateUser`, which needs a `sessions.impersonated_by` column the schema lacks. Its endpoints (`startImpersonation`, `stopImpersonation`, `getImpersonation`) are `SERVER_ONLY` and `isClosedAuthPath` also closes `/api/auth/impersonation`. Call `auth.api.*` admin endpoints only from `actions/admin/*` behind `requireAdmin`.
- Start needs a platform admin, a reason, and a target that is not an admin, not the admin, not banned, and onboarded. It creates a 15-minute session (`impersonationMinutes` in `config/app.json`) and a signed `admin_session` cookie holding the admin token, then records `impersonation.started` (reason, session id, expiry); a failed audit deletes the session. Stop restores the admin session, records `impersonation.stopped` with the start reason, and still works after expiry. Signing out drops the admin cookie.
- While active, the plugin blocks change email, change password, delete user, link and unlink account, set password, and session revocation (`NOT_ALLOWED_WHILE_IMPERSONATING`); `deleteAccount` checks `isImpersonating()`; `/admin` answers not found because the target is not an admin.
- `ImpersonationBanner` (server, mounted once in `(dashboard)/layout.tsx`) reads `getImpersonation()` from `actions/admin/impersonation-state.ts`, which checks the cookie header first, and renders `ImpersonationNotice`: a fixed bottom pill with the name, reason, countdown, and a stop button, plus an automatic stop at expiry. Start and stop hard navigate with `window.location.assign`.
- Limits: the Better Auth cookie cache (5 minutes) can serve a session after its database expiry, so only `getImpersonation` and the banner enforce the 15 minutes exactly. Events written while impersonating name the impersonated user as actor; only start and stop carry the admin.
