# Organizations

Organization domain rules: invitations, members, ownership, settings, insights, and applications. Product context: `app.md`.

## Invitations and invite links

### Invitation rules

- Invitations never create memberships or accounts for an existing person. Accepting one does (`src/db/mutations/invitation.ts`).
- Never call `signUpEmail` or insert a membership for an invitee outside that mutation.
- A person who already holds a membership (for example through an invite link sent after the invitation) is upgraded when the invited role outranks the current one (`learner`, `volunteer`, `tutor`, `representative`, `admin`). A lower or equal invited role keeps the current role.
- Inviting records a token, a role, an optional message, and an expiry of `invitationExpiryDays`, and mails `/invite/[token]?proof=...`.
- The row carries `userId` when an account with that email exists, still without a membership.

### Invitation page

- `/invite/[token]` is public and noindex.
- A new person creates the account only with the emailed `proof`, a second one-time secret kept hashed in `verifications` (`org-invite:<id>`).
- A link without the proof offers to mail a fresh proof link (`requestInvitationProof`, rate limited), so a copied link alone never yields a verified account.
- The new account lands on onboarding.
- An existing account signs in, then accepts or declines.
- Another signed-in account sees a masked-email mismatch with sign out.
- Expired, revoked, accepted, and declined tokens show a closed state. Declining works signed out.

### Managing invitations

- Managers (`admin`, `representative`) invite one person or paste up to `maxBulkInvites` (per-row results).
- From the Invitations tab, managers then resend (60s cooldown, rotates the token and proof), revoke, or copy the link.
- The panel payload never holds a token. Copying calls `copyOrganizationInvitationLink` or `copyOrganizationInviteLink`.
- Those calls re-check the role (`canManageInvitation`) and return the link without the proof.
- A representative cannot invite `admin` or `representative`. A second `admin` is refused (`ROLE_TAKEN`).

### Invite links

- Invite links (`/join/[token]`, learner or volunteer only) carry `maxUses`, an expiry, and optional approval.
- A signed-in person joins, or files a request tied to their `userId`.
- A guest gives name and email and receives an invitation by mail, which verifies the address.
- Replies are generic, so a link never reveals whether an address is a member.
- Approving a join request that has a `userId` (filed signed in) adds the membership.
- Approving an anonymous request sends an invitation instead, so only the person's own acceptance links an existing account.
- Revoking an invitation or link ends its token at once.
- Removing a member (`removeMembership`) also revokes the links and open invitations that person created.
- It also deletes their unaccepted legacy join tokens when no membership or team role remains.
- Organization approval, platform-admin organization invites, and admin member invites send an `admin` or member invitation. None creates an account or a membership.
- Public actions are rate limited: `invite-account`, `invite-proof`, `invite-decline`, `join-link`. Invite sign-in shares the `login` keys.

## Members and ownership

- `/organization?tab=members` is a `DataTable` named "Members" with search, role and status filters, sorting, and pagination.
- "Details" opens a drawer with the profile, learning progress, and the member's non-draft certificates in this org (`getOrganizationMemberDetail`, managers only).
- Role changes, removals, leaving, and ownership transfers live in `db/mutations/organization.ts` and return `memberError` codes.
- Only the owner changes roles, and never to or from `admin`. The owner role moves through an ownership transfer.
- Managers remove members. A representative removes only learners, tutors, and volunteers.
- Nobody removes themselves. A member leaves through `leaveOrganization`, which also moves the active org cookie.

### Ownership transfer

- Transfer (`transferOrganizationOwnership`): the owner picks an onboarded `representative` and types the organization name.
- One transaction swaps the roles and records `organization.ownership_transferred`, which mails both people.
- The notification shows `_gained` for the new owner and `_left` for the previous one through the event `variant`.
- The last owner can neither leave nor be removed (`LAST_OWNER`).
- Demoting, removing, or losing a tutor returns their open reviews (`submitted`, `in_review`, `changes_requested`) to the pool through `certificate.unassigned`. Approved certificates keep their reviewer.
- Role changes record `member.role_changed`. Leaving records `member.left`.
- Every org action takes an optional `organizationId`, resolved by `getOrganizationAccess`.
- Members act on orgs they belong to. Platform admins act as owner on any org, never on ownership transfers.

## Settings and signatory

- `OrganizationSettings` serves `/organization?tab=settings` and `/admin/organizations/[id]?tab=settings`.
- Only the owner (or a platform admin through `organizationId`) edits.
- Sections: branding, details, per-locale description, legal identity (`legalName`, `registryId`), certificate signatory, contact, danger zone.
- The description form sends only the locales the user edited.
- `mergeDescription` merges them into the stored record under a row lock, so an edit in one language never overwrites another. A blank value removes that locale.
- The signatory is `organization_profiles.legalRepresentative` (printed after "Represented by") plus an optional PNG or JPG `signatureUrl`.
- The signature uploads to the R2 prefix `signatures/<orgId>-` through a presigned URL (`r2PresignSignature`).
- The PDF also reads `avatarUrl` as the logo. `pdfImage` skips `.webp`.
- A certificate with a stored `snapshot` regenerates with the snapshot's signatory, so changes reach only new approvals.
- Replacing or removing a logo or signature deletes the old R2 object only when no certificate `snapshot` references its URL (`deleteOrganizationAsset`).
- Deleting an organization is refused with `HAS_CERTIFICATES` once any certificate exists.
- Otherwise deleting removes the row, expires member access caches, and deletes the logo.
- Org identity lives in `organizations`. Sparse fields live in `organization_profiles`.

## Overview, insights, and activity

### Overview

- The overview opens with a first-run checklist (`buildChecklist` in `src/db/queries/organization-insights.ts`).
- The checklist items are: profile and signatory (legal name, registry ID, representative), a tutor (member or pending invitation), volunteers (same), and a first non-draft certificate.
- The checklist disappears once all four hold.
- The panel payload (`getOrganizationPanel`) also carries the certificate `pipeline` by status and the first activity page, never tokens.

### Certificates tab

- `?tab=certificates` renders `OrganizationCertificatesPanel`.
- The panel loads `listOrganizationCertificates` and `listOrgTutors` for the organization on demand (skeleton, error banner with retry) and mounts `OrganizationCertificates`.
- `/admin/organizations/[id]` and `/admin/certificates?org=ID` mount the same panel. `OrganizationPipeline` stays in the overview.

### Insights tab

- `?tab=insights` loads `getOrganizationInsights(organizationId?)` on demand (managers only).
- It shows learning progress of learners and volunteers, certificates submitted and approved per month (`Chart`, 12 months), average review time, and tutor workload (open and reviewed).
- It shows an anonymous rating aggregate from `organization_ratings`, hidden below `RATING_MIN_COUNT` (3) ratings. Comments are never returned.

### Activity tab

- `?tab=activity` pages `activity_events` by organization (`getOrganizationActivity(cursor?, organizationId?)`, 20 per page, newest first).
- `listOrganizationActivity` resolves actor, target, and tutor names on the server.
- The client renders `activity_<action with dots as underscores>` messages and falls back to `activity_unknown`, so a new event type only needs a message.
- Invitation rows resolve at read time from `organization_invitations` of the same organization.
- The invitee shows as the user name or the invitation email while the row exists, and `_unnamed` neutral keys apply afterwards.
- No email is added to event metadata.
- The admin organization page reuses the same action with `organizationId`.

## Applications

- `/register` is a four-step application (`features/organization/application/`): organization, legal representative plus an optional contact person, motivation, and a review.
- Organization fields: name, legal name, registry ID, country, city, email, website, volunteers per year.
- The review step has the required Quality Charter checkbox (link to `/quality-charter` in a new tab).
- The zod schema in `src/db/queries/organization-application.ts` is shared by the form and the server. Its messages are error codes that the form translates.
- `requestOrganizationRegistration` rate limits by IP and email, then calls `submitOrganizationApplication`.
- `submitOrganizationApplication` creates the unapproved organization and fills the profile (`legalName`, `registryId`, `legalRepresentative`, contact, `volunteersPerYear`, `motivation`, `charterAcceptedAt`).
- It also files the representative's pending `admin` join request and records `organization.application_received`, which mails the applicant a receipt and the platform admins.

### Review

- Platform admins review in `/admin/organizations`: the row menu opens an application sheet with all submitted data.
- Approving sends the representative an invitation to `/invite/[token]`. No account is created or linked before they accept.
- Both decisions update the request only while it is `pending`, and approving also requires an unapproved organization. A simultaneous second decision fails with a `CONFLICT` and sends no second mail.
- Rejecting is a mutation (`rejectOrganizationApplication`) that keeps the organization, marks the request rejected, and records `organization.application_decided` with `approved: false`.
- The `organization/application-decision` template (own subject, intro, and buttons) mails approved and declined decisions.
- `/admin/organizations/[id]` reuses the organization components with `organizationId`.
- It shows the same members, invitations (without invite links), settings, and activity tabs, plus an application tab for organizations that applied.
