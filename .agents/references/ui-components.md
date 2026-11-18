# UI component and shell reference

Detail moved out of `.agents/specs/ui.md` to keep that spec within its token budget. The rules still apply.

## DataTable

- Input: rows, stable row IDs, columns with optional sort accessors, a filters slot, and a row-actions slot.
- It sorts and paginates the supplied rows locally, announces counts, and provides loading and empty states.
- While `loading`, it shows a spinner in place of the header row and the rows, and hides the count. Column widths depend on the rows.
- Pass `pagination` (page, pageCount, total, onPageChange) for server-paged rows.
- `pageResetKey` returns a client-paged table to its first page when the value changes, with a render-time state compare. Pass the search and filter values. Never use `key` for this, because `filters` renders inside the table and would remount.
- `skeleton` with `loading` keeps the real header and shows `pageSize` placeholder rows that follow the column layout, instead of a spinner. Use it for server-paged lists.
- `selectable` adds a checkbox column with select all on the page. Selection spans pages by row id. Control it with `selectedIds` and `onSelectionChange`, or leave it to the table. `rowLabel(row)` names each checkbox and is required with `selectable`.
- Without `pagination`, the selection is the stored ids that still exist in `rows`. `onSelectionChange` fires only on user actions, never on a prune, so a controlled parent filters its own ids by the rows it holds before it acts; `bulkActions` always receives the pruned ids. With `pagination`, the caller clears the selection when a filter or the query changes, because the table cannot see the other pages.
- While rows are selected, the toolbar shows the count, `bulkActions(ids)`, and "Clear selection". Escape inside the table clears the selection. Below `sm`, a labeled checkbox above the list selects the page.
- Below `sm` each row becomes a labeled card (cells carry `data-label`), so status and actions stay reachable.
- Below `sm` a compact sort select plus a direction toggle replaces the hidden column sorts (`data-table-sort.ts`).

## Chart

- `Chart` loads `chart-renderer.tsx` through `next/dynamic` with a local skeleton.
- `loading` renders the same `h-64` box as a `Skeleton`.
- Only the renderer imports Recharts. Its targeted lint override accounts for this boundary.
- Charts use semantic chart tokens, localize values, disable chart animation, and include an accessible data table.
- Mount charts only on analytics surfaces with real data.
- Put the screen-reader table inside an `sr-only` div, never `sr-only` on the `<table>` itself, because a table keeps its content width and scrolls the page sideways at 390px.

## Shell: sidebar, switcher, palette

- `components/layout/navigation.ts` is the single role table (pure, tested).
- Each entry has a group (`pages`, `settings`, `organization`, `admin`, `actions`), an href, an icon, and a `visible(viewer)` rule over `{ canEdit, isAdmin, role }`.
- The sidebar renders the `sidebar` entries, the palette renders every visible entry, and `use-navigation-labels` maps each id to its translated label.
- Roles (D25): team members (`canEdit`: platform admins and editors) get Dashboard, Courses, and Docs, plus the Admin group for platform admins.
- Team members get no Organization item, no Certificates, and no org switcher.
- Org owners and representatives add Organization. Learners have no Certificates.

### Page container

- `DashboardPage` renders `Header` and `Main`, and both use the `page` spacing token as the side gutter: 16px, 24px from `sm`, 32px from `lg`.
- Use `px-page` or `-mx-page` for a page gutter. Never hard-code one.
- `Header` puts its children in an inner container as wide as `Main`, so the sidebar trigger and the content share one edge. Its `className` styles that inner container.
- `Main` sets the vertical rhythm: content starts 16px below the header (24px from `sm`), and the page ends with 48px (64px from `sm`). A page root sets no outer padding.
- `width` on `DashboardPage` sets the content column, and a narrower column centers.
- Use `full` for lists, tables, and dashboards, `content` for details, forms, wizards, and about pages, `prose` for articles, notifications, and course completion, and `wide` for the course player.
- A `Tabs` provider that wraps the shell sets `gap-0`, so the header keeps its gap to the content.

### Page titles

- Each page has one `h1`. A section page passes `title`, and the header bar renders it as the `h1`.
- A page that renders a `PageHeader` passes no title to the bar, so the content owns the `h1`.
- A record page also passes `parent`, a navigation id. The bar shows the parent link, then the title with `aria-current="page"`, and the content owns the `h1`.
- `navigationHref` and `NavigationLabel` give the parent its href and label from the navigation table.
- Build a content title with `PageHeader`: `PageHeaderHeading` (title, description, meta) and `PageHeaderActions`.
- Every content `h1` is a `PageHeaderTitle` (`type-title`), and every page description is a `PageHeaderDescription`. A title inside a card uses the same parts.
- Put a category, step, or date below the title. Never put a label above it.

### Org switcher and palette

- The org switcher (`organization-switcher.tsx`) reuses the active-org mechanism: `useSession().setOrganization` writes the `org` cookie that `getActiveOrgId` reads.
- It lists memberships, the viewer's pending invitations (`listMyPendingInvitations`, polled every 2 minutes, links to `/api/v1/invitations/[id]`), and a link to `/register`.
- It offers Leave for non-owners through `LeaveOrganizationDialog` (`leaveOrganization`, gotcha 16).
- The palette opens with `SHORTCUTS.search` (Cmd or Ctrl plus K).
- Courses and docs filter in the browser (`listCourses`, `useDocsSearch`).
- Certificates and members come from `searchWorkspace` (`actions/shell/search.ts`), which scopes server-side.
- Certificate scope: own certificates for everyone but team members, assigned and pooled `submitted` requests for tutors, and every non-draft certificate of the active organization for owners and representatives.
- Member scope: owners and representatives in the active organization only.
- Team members get neither. Drafts are visible to their holder only. Queries shorter than 2 characters return nothing.
- The bell stays in the sidebar's top group under Search, as the second row.

## Email colors

- Email templates use their own Tailwind config in `src/emails/layout.tsx`, with hex values from `colors.generated.ts`: `EMAIL_COLORS` (light) and `EMAIL_COLORS_DARK`, each with `action`, `actionText`, `border`, `canvas`, `danger`, `faint`, `muted`, `onDanger`, `onFill`, `sunken`, `surface`, `text`, and `title`. Dark names carry a `-dark` suffix and apply through `dark:` classes. Class strings live in `src/emails/classes.ts` (`EMAIL_CLASSES`), so a template never writes a hex value. The `brand` color is the `action` blue, because email buttons carry white text.
