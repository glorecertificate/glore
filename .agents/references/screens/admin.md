# Admin screens

Layout rules shared by the admin pages. Admin behavior and guards: `.agents/specs/admin.md`.

## Screen anatomy

- Every admin, translations, and emails page renders `PageIntro` (`ui/page-header.tsx`): a visible description and optional actions, then the content. The title stays in the header bar.
- The server-paged lists (users, certificates, audit) use `LoadingFallback` as the `Suspense` fallback, because the full table skeleton adds about 40 ms to the first paint on a slow phone.
- Primary actions sit in the page header (`Create organization` as a split button with `Invite organization` in its menu, `Invite member`), never inside a table card.
- Lists use `DataTable` with a `FilterBar`. `/admin/organizations` and `/admin/team` sort and filter locally with a header sort, and the server-paged lists (users, certificates, audit) sort by recency only.
- States are `StatusBadge` tones: pending `warning`, active or joined `success`, rejected or banned `danger`. Roles and audit categories stay `Badge`.
- The organization record header is a `PageHeader` (avatar, `PageHeaderTitle`, status, meta list) with the review actions in `PageHeaderActions`. The application tab links the website and emails.
- Row actions are one `ellipsis` menu with a destructive item last, and a confirm dialog for every destructive or irreversible action.
- `/admin/organizations` and `/admin/team` page locally at 10 rows (the `DataTable` default). They were unpaginated before.

## Dialogs and focus

- Every admin confirm dialog (approve, reject, ban, unban, impersonate, remove member, invite, create) is `ActionDialog` (`action-dialog.tsx`): a form (Enter submits), a pending state that blocks closing, and focus return.
- The `destructive` tone (reject, ban, removal) renders an `AlertDialog`, which gives `role=alertdialog`, focus on Cancel, and no close on outside click.
- Handlers wrap the action in `try/finally` so a rejected call never traps the dialog, and show the `...Error` toast.
- Focus return uses `useReturnFocus` (`hooks/use-return-focus.ts`).
- The owner calls `remember()` when it opens a dialog (from a row menu item or a header button) and passes `restore(event, listFocusTarget)` as `onCloseAutoFocus`. When the row unmounts, focus goes to the list.

## Paging and settings

- A client-paged `DataTable` (organizations, team) takes `pageResetKey` built from its filters so paging resets without remounting the filters.
- The server-paged lists run nuqs updates in `startTransition`, so the current rows stay visible with `aria-busy` and reduced opacity, and the skeleton shows only on first load.
- Settings sections are cards with a sticky save bar that shows the unsaved state.
- Audit categories use `StatusBadge` with a per-category icon and tone map (`CATEGORY_META`).
