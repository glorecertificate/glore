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
- Use `full` for lists, tables, and dashboards, `content` for details, forms, and wizards, `prose` for notifications and course completion, and `wide` for the course player. About, help, docs articles, and the course overview use `full`.
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

## Brand shell: pages without the sidebar

- `features/auth/brand-shell.tsx` (`BrandShell`) is the frame for the legal document, legal acceptance, verify, public certificate, error, not-found and offline pages. `AuthFlow` (login) and `AuthFrame` (register, onboarding, invitation, join) are the centered auth frames.
- It renders the band with the globe, the logo chip and optional `actions`, then the content in one centered column. `size` sets the column width: `xs`, `sm`, `md` (default) or `lg`.
- `title` and `description` go in the band. The content column overlaps the band by 4rem, so its first block must be an opaque card.
- Pages with the sidebar use `DashboardPage` instead.

## Email colors

- Email templates use their own Tailwind config in `src/emails/layout.tsx`, with hex values from `colors.generated.ts`: `EMAIL_COLORS` (light) and `EMAIL_COLORS_DARK`, each with `action`, `actionText`, `border`, `canvas`, `danger`, `faint`, `muted`, `onDanger`, `onFill`, `sunken`, `surface`, `text`, and `title`. Dark names carry a `-dark` suffix and apply through `dark:` classes. Class strings live in `src/emails/classes.ts` (`EMAIL_CLASSES`), so a template never writes a hex value. The `brand` color is the `action` blue, because email buttons carry white text.

## Loading states

- A loading state either reproduces its content exactly, or it is a `Spinner`. Never ship an approximate or generic `Skeleton`.
- An exact skeleton has the layout, element count, heights, and widths of the content, so nothing moves when the content arrives.
- Build the skeleton from the layout components and size tokens of the content, so the two cannot drift apart.
- Use a `Spinner` when the shape depends on the data, for example an unknown row count or text of variable length.
- The swap from the loading state to the content is a short fade, never a pop. With reduced motion it is instant.
- Check each loading state in a browser on a throttled network. Nothing on the page may move or resize when the content arrives.
- A feature with a fixed layout renders itself as its skeleton: give it a `loading` prop and placeholder data (`AdminOverviewSkeleton`, organization insights and certificates).
- `StatCard` and `Chart` take `loading`. `SkeletonText` wraps placeholder text, so the skeleton has the line count and width of real text.
- Labels, titles, and other static text stay real in a skeleton. Only data becomes `SkeletonText`.
- A region whose size depends on data, such as a list or a table body, shows `LoadingFallback` inside the exact skeleton.
- The header bar never waits for data. A layout or page fallback is `DashboardLoading` (the bar and a spinner), never a full-page spinner.
- `DashboardLoading` grows `Main` to the full height and centers the spinner in it (`LoadingFallback size="page"`). The spinner fades in after 100 ms, so a navigation that reads as instant shows only the header.
- `LoadingFallback` is an `output` element with a translated label for screen readers. Pass `label={null}` outside the intl provider.
- A `Spinner` without `size` takes its size from the parent, as in a `Button`. Pass `size` when it stands alone.
- Put `animate-reveal` on content that replaces a loading state the user saw. It fades in for 150 ms and is off with reduced motion.
- A fade from opacity 0 delays LCP by its length, so content of a first render or a server stream paints at once. A component with a `loading` prop fades through `useReveal(loading)`.
- React holds a streamed boundary up to 300 ms after the first frame. `InstantReveal` in the root layout keeps `$RT` unset, so each boundary paints in the frame after it arrives.

## Layout rules

- `Card` sets neither `h-full` nor `justify-between`, because a percentage height under the flex `Main` stretched cards to the page height and grid-stretched cards spread their rows.
- Pass `h-full` at call sites that need full height (course cards, `StatLink`, doc article cards). `StatCard` and the course list card keep `justify-between` explicitly.
- Tab lists use `min-w-0 justify-start`, so an overflowing list does not center and clip its first tabs.
- `SegmentedControl` and `SegmentedControlItem` use Radix radio semantics and keyboard navigation.
- `CopyButton` handles clipboard failures and ignores stale completions after its value changes.
- `QrCode` imports the QR encoder on demand and provides loading and error states.
- `AvatarStack` lives in `avatar-stack.tsx`, requires stable avatar IDs and labels, and always renders a fallback.
- Skill groups map to brand tones in `features/courses/skill-group.ts`: Communication `brand`, Personal `brand-quaternary` (AA-checked teal), Social `brand-secondary`, Work `brand-tertiary`.
- Chart colors use text variants to keep contrast in both themes.
- The organization roster uses `DataTable`, and its overview uses `StatCard` and `AvatarStack`.
- Certificate views consume the sharing, timeline, and level primitives.

## Controls detail

- `InlineInput` takes `size="title"` for the `type-title` role. Its placeholder uses the `placeholder:text-muted-foreground` input token.
- `Markdown` is a server component with a static `react-markdown` import. Use it from server components, where static content renders on the server.
- A client component uses `MarkdownLazy` (`markdown-lazy.tsx`), which loads `Markdown` with `next/dynamic` and no loading state, so `react-markdown` stays out of its route bundle. Call `preloadMarkdown()` when the client surface mounts, so the text appears with the content. Never import `Markdown` from a `'use client'` file.
- `DialogContent` keeps its close button in a sticky corner anchor, so it stays put while a long dialog scrolls. `DialogTitle` reserves space for it. On open, focus goes to an existing autofocus target, else to the first visible field outside the footer, else to the dialog itself. It never scrolls, and never lands on the close button or a link.

## Migrate a page to the band

1. Move the title, the `PageIntro` description, and the header buttons into the `title`, `description`, and `actions` props of `DashboardPage`. Delete the `PageIntro` or `PageHeader` wrapper.
2. Move section tabs into `breadcrumb`. Filters and toolbars stay in the content.
3. Add `overlap` only when the first block is an opaque card (`Card`, `StatCard`, `DataTable`, `Banner`, `DashboardHero`). Otherwise omit it, and the band ends with a clean gap.
4. Never leave loose text, tabs, or filters in the overlap strip.
5. Inside the band, read `band-*` tokens or rely on `band-scope`. Never add the `dark` class or a color override.
6. A page with a data-dependent heading passes `header` (see `DashboardBand`). One `h1` per page: the band owns it.
7. Example: "Band migration example" below.

## Band migration example

`/admin/users`, before:

```tsx
<DashboardPage title={<PageTitle namespace="Admin.users" name="title" />}>
  <PageIntro description={<PageTitle namespace="Admin.users" name="description" />}>
    <AdminUsersContent />
  </PageIntro>
</DashboardPage>
```

After (the first block is a `DataTable` card, so `overlap` is set):

```tsx
<DashboardPage
  overlap
  description={<PageTitle namespace="Admin.users" name="description" />}
  title={<PageTitle namespace="Admin.users" name="title" />}
>
  <AdminUsersContent />
</DashboardPage>
```

## Courses, docs, help, and about on the band

- `/courses`: `CourseListDescription`, `CourseListActions`, and `CourseListTabsList` fill the `description`, `actions`, and `breadcrumb` props. `CourseListTabs` is the `provider`, so the tab list in the band and the tab content share one `Tabs` root. The toolbar holds only the filters.
- Course overview, completion, and article pages pass `header`: an async component that loads the cached record and renders `DashboardHeader` (`CourseOverviewHeader`, `CourseCompleteHeader`, `ArticleHeader`). The `Suspense` fallback is a bare `DashboardHeader`, so no new loading state appears.
- Chips inside the band use `bg-band-scrim text-band-foreground`. Never use a `Badge` tone there.
- Band buttons use `band` (primary) and `band-secondary`. A shared button that sits only in a band takes those variants directly.
- The course editor passes `header={<CourseHeader />}` and `provider={CourseEditorTabs}`. `CourseHeading` is a render prop that gives the editable title, description, icon, and length counter to `DashboardHeader`, whose `heading` prop replaces the `h1` content while `title` still feeds the breadcrumb.
- The player, completion, skill framework, docs article, and about pages use `overlap` because their first block is an opaque card. Help, courses, docs, and the overview start after a clean gap.
- The lesson reader overrides the vendored editor border from outside with a `[&_[data-slate-editor]]` wrapper, never inside `ui/rich-text-editor/`.

## Mobile and touch

Owner decisions, 2026-11-18. Controls keep their visible size on every device.

- `touch-hit` adds a centered 44px pseudo-element hit area on coarse pointers. `touch-hit-y` extends only the height, for controls that sit edge to edge.
- Button, select trigger, checkbox, switch, rating item, tabs trigger, toolbar button, sidebar menu button, dialog close, sheet close, and password toggle carry it.
- Neighbouring hit areas must not overlap. `SidebarMenu` and `ToolbarGroup` add gap on coarse pointers. `ButtonGroup` children use the height-only form.
- Touch growth is exactly 44px and never more. A touch gap is the smallest step that keeps neighbouring hit areas apart: 44px minus the control height. A 32px control gets 12px, a 36px control gets 8px.
- Contiguous lists and grids cannot hold 44px hit areas without growing. On coarse pointers, menu, select, and command rows use `touch-row`, and calendar cells use `calendar-cell`. Set `--touch-row-min: 0px` and `--touch-cell: --spacing(8)` in `:root` to revert both.
- Inputs, textareas, and the command input use 16px on coarse pointers. A caller that sets `text-sm` on a field breaks this rule.
- `viewportFit: 'cover'` and `interactiveWidget: 'resizes-content'` are set in `lib/metadata.ts`. `pt-safe`, `pb-safe`, and `px-page-safe` add the safe-area insets to fixed bars.
- `Dialog` and `AlertDialog` are bottom sheets below `sm`. The body scrolls, the footer sticks, and the confirm action is last and at the bottom.
- `DropdownMenu` and `Popover` cap their height with the Radix available-height variable and scroll inside.
- `InfoTip` opens a popover on tap. Use it instead of a tooltip for text that has no other path on touch. Pass `nested` inside another button. The nested form is hidden from assistive technology and adds the label as screen-reader text, because a control cannot sit inside a button.

### Shell by width

- Below 768px, the sidebar is a drawer. It closes on navigation, has its own close button, and uses `h-dvh`.
- From 768px to 1023px, the sidebar is an icon rail (`collapsible="icon"`). The expand button at the top of the rail opens the full sidebar as an overlay with a backdrop. It closes on navigation, Escape, or a tap outside.
- From 1024px, the full sidebar shows. `useDevice` returns `isTablet` for the middle range.
- `PhoneAppBar` is a fixed bar below `md` with the menu button and the page title. It slides in when the band scrolls out. It stacks under the impersonation notice.
- The menu button shows a dot for unread notifications and pending invitations. It shows only while the navigation is hidden.
- `Kbd` and `KbdGroup` are hidden on coarse pointers.
- A scrolling `TabsList`, the table container, and the sidebar content add vertical padding with a matching negative margin on coarse pointers, so the hit areas are not clipped and the layout does not move. `tabs-scroll-band` repaints the list background to its original height.
- The offline promise is the offline page only. The service worker caches no course or certificate data.
- `pb-bar-safe` pads a fixed bottom bar with at least 8px or the safe-area inset. Course editor controls take `touch-hit`, never a hand-written `before:` hit area.
- `DataTable` stacks its count under the filters below `sm`, so the count never squeezes the search field.
- `EmailText` renders an email with break points after `@` and before each dot. Use it where a long email wraps in a card.
- The install prompt is a toast on pointer devices, shown only while no dialog is open. On touch it is `PwaInstallBanner`, a dismissible banner at the top of `SidebarInset`, so it never covers content.
- Band tab lists read `--tabs-list-bg` (set by `band-tabs`), so the scrolling tab list on touch keeps the band scrim.

## Course editor on phones and tablets

- Below `xl` (1280px, because the full sidebar takes 256px at 1024px) the lesson picker opens a bottom `Sheet` with `CourseSidebar variant="sheet"`. The same component serves the inline sidebar from `lg`. On coarse pointers each row adds Move up, Move down, and Delete, next to the drag handle. Choosing a lesson closes the sheet.
- Below `md` the band shows the title, the status chips, and the language tabs. Settings, analytics, and preview sit in a More menu. Save and the Draft or Published switch sit in a bottom bar portalled to `body` with the safe-area inset. The description shows 2 lines and expands on tap.
- `course-editor/block-actions.tsx` is a touch-only Block menu (Move up, Move down, Duplicate, Turn into, Ask AI, Delete). It acts on the top-level block at the caret through the Plate editor API and replaces the context menu that `block-context-menu.tsx` turns off on touch.
- `lesson-editor.tsx` wraps the vendored editor. Below `xl` the fixed toolbar is one row that scrolls sideways and sticks to the viewport. On coarse pointers the floating selection toolbar is hidden.
