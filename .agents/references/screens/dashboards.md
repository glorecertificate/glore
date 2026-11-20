# Dashboards and overviews

Screen notes for the picked dashboard layouts. Role facts live in `.agents/specs/app.md` (Dashboard) and `.agents/specs/admin.md` (Overview).

## Shared parts

- `DashboardHero` (`features/dashboard/hero.tsx`) takes an optional action. The action sits under the text, so no button overlaps the globe.
- `AttentionList` (`features/organization/attention-list.tsx`) is one list for the owner dashboard and the organization overview. It shows an icon, a one-line title, a one-line context and one secondary button per row. Expired invitations resend in place.
- `buildAttention` (`db/queries/organization-attention.ts`) is pure. It orders join requests, then changes-requested certificates, then expired invitations, oldest first, capped at six. A representative sees only the invitations they can manage.
- `OrganizationCertificatesCard` and `OrganizationMembersCard` (`features/organization/overview-rail.tsx`) form the right rail. They list non-zero statuses and roles only.

## Picks

- Volunteer: the journey rail card beside one stage card. The band carries the greeting, and the volunteer view has no welcome card.
- Tutor: A, queue first. The queue page and its filter rail belong to the certificate list.
- Owner and representative: A, attention first.
- Admin overview: A, decision queue first. The editor dashboard keeps its own page.
- Organization overview: A, work queue first. The band stays with the organization tabs.
