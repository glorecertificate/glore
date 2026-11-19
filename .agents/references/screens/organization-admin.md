# Organization and admin screens

Picks built: org-tabs A (tabs in the band), admin-lists D with A's split button and inline Review, admin-org-detail C (table with facts rail).

## Organization tabs (`/organization`)

- The band shows the title, the organization name and city, the tab strip, and the one `Invite member` primary.
- No tab repeats its name as a body heading. The invite dialog is owned by `OrganizationInviteHost`.
- Members and Invitations use the filter rail with counts. The member table has no Details button: the name opens the drawer.
- Settings uses `SectionNav` and `StickySaveBar`. The tablet layout puts the section strip above the form, and the side nav starts at `lg`.

## Admin organizations list

- The primary is a split button: Create organization, with Invite organization in the menu.
- Pending rows carry an outlined Review button. It opens the application sheet, or the approve dialog when no application exists.
- Selecting rows shows Approve and Reject in the table toolbar. Bulk reject needs a reason. Only pending rows count.
- The Status facet shows counts, with All as the cleared state.

## Admin organization detail

- Main column: tabs and the member table. Right rail (320 px): About and Danger zone.
- A pending organization shows Approve and Reject in the band instead of Invite member.

## Not built

- Row click to open a detail page (the `DataTable` has no row link), the collapsible About on phones, and the Users, Certificates, and Team list tweaks of the admin-lists pick.
