# UI kit, theming, and motion

Release UI kit APIs, color and typography tokens, elevation, and motion. Component authoring rules: `patterns.md`.

## Release UI kit

- Shared primitives live in `src/components/ui/`. They accept root props and localized labels.
- `/dev/ui` (development and previews only) shows each primitive in each state, with the prop that sets the state as the row label. Add or update a specimen in `features/dev/` with each primitive change.
- Feature components own domain data and permission checks.
- `ArrowsMotif` uses vector paths extracted from the certificate template. It is decorative and hidden from assistive technology.
- `LevelDots` takes a level, a number of `steps`, and a localized level label. It renders only after issue or in the tutor workspace.
- `Timeline` and `TimelineItem` compose dated entries, with ISO `dateTime` values and separately localized display times.
- `StatCard` composes `NumberTicker`. Formatting follows next-intl, and the ticker respects reduced motion.
- `Banner` supplies semantic status variants.
- `StatusBadge` takes a `tone` (`neutral`, `info`, `success`, `warning`, `danger`) and an optional icon.
- A domain status has one `StatusMeta` map (icon, label key, tone) in its feature folder. `CERTIFICATE_STATUS` lives in `features/certificates/status.ts`.
- Render a certificate status with `CertificateStatusBadge`, and read a status label from `CERTIFICATE_STATUS`. Never add a second map.
- `Kbd` and `KbdGroup` render key hints. `useModifierKey()` returns `⌘` on Apple systems and `Ctrl` elsewhere. Never hard-code `⌘`.
- Every app shortcut is an entry of `SHORTCUTS` in `lib/shortcuts.ts`. Bind it with `useShortcut` and show it with `KbdShortcut`, so the key, the hint, and the matcher agree.
- A modifier shortcut needs Cmd or Ctrl and no Shift or Alt. A single-key shortcut, such as `/` (`Input` `hotkey`), never fires while focus is in a field.
- `DescriptionList` has three layouts: `stacked` (label above value, `columns={2}` from `sm`), `rows` (a 12rem label column with dividers), and `inline` (label left, value right).
- A `DescriptionItem` holds only its term and details. Put an action such as `CopyButton` inside `DescriptionDetails`.
- `EmptyDescription` renders a `p`, so pass phrasing content only.
- `FilterBar` holds the controls of a filter row. Pass `active` and `onClear` to show "Clear filters" (`Common.clearFilters`).
- After a clear, `FilterBar` moves focus to its first control, so focus never drops to the page.
- Import `toast` from `@/components/ui/toast`. Errors stay 8s, warnings 6s, info 4s, and success 2.5s. A caller can still set `duration`.
- `ShareButton` opens the native share sheet. Without one, it copies the URL and shows a toast. Use `CopyButton` when the action only copies.

### Layout rules

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

### DataTable

- Input: rows, stable row IDs, columns with optional sort accessors, a filters slot, and a row-actions slot.
- It sorts and paginates the supplied rows locally, announces counts, and provides loading and empty states.
- While `loading`, it shows a spinner in place of the header row and the rows, and hides the count. Column widths depend on the rows.
- Pass `pagination` (page, pageCount, total, onPageChange) for server-paged rows.
- `skeleton` with `loading` keeps the real header and shows `pageSize` placeholder rows that follow the column layout, instead of a spinner. Use it for server-paged lists.
- `selectable` adds a checkbox column with select all on the page. Selection spans pages by row id. Control it with `selectedIds` and `onSelectionChange`, or leave it to the table. `rowLabel(row)` names each checkbox and is required with `selectable`.
- Without `pagination`, the selection is the stored ids that still exist in `rows`. `onSelectionChange` fires only on user actions, never on a prune, so a controlled parent filters its own ids by the rows it holds before it acts; `bulkActions` always receives the pruned ids. With `pagination`, the caller clears the selection when a filter or the query changes, because the table cannot see the other pages.
- While rows are selected, the toolbar shows the count, `bulkActions(ids)`, and "Clear selection". Escape inside the table clears the selection. Below `sm`, a labeled checkbox above the list selects the page.
- Below `sm` each row becomes a labeled card (cells carry `data-label`), so status and actions stay reachable.
- Below `sm` a compact sort select plus a direction toggle replaces the hidden column sorts (`data-table-sort.ts`).

### Chart

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

## Color and typography

- `config/theme.json` (`system`) is the palette source. `pnpm run theme` writes `src/styles/tokens.generated.css` and `src/emails/colors.generated.ts`. Never edit them by hand.
- `pnpm run check:theme` fails on a stale generated file or on a contrast pair below its minimum.
- The generator (`scripts/theme/`) solves text, fill, and ring lightness in OKLCH against the targets in `system.contrast`.
- Targets are 4.5:1 for text, 6:1 for `fg-2`, 5:1 for colored text, and 3:1 for non-text. Declare a pair in the generator before you use a new combination.
- Surface roles: `surface-0` to `surface-3`, `surface-sunken` (sidebar and canvas), `surface-muted`, `surface-hover`, and `surface-selected`.
- Text and border roles: `fg-1` to `fg-3`, `fg-disabled`, `fg-title` (navy), `fg-on-fill`, `fg-on-bright`, `fg-on-danger`, `border-subtle`, `border`, and `border-strong` (3:1).
- `action` (blue) marks actions only. It has `-hover`, `-subtle`, `-border`, and `-text`.
- `earned` (olive) marks earned seals, with `-subtle`, `-border`, and `-text`. `current-fill` (navy) marks the current stage, with `current-subtle`. Tailwind reserves `current` for `currentColor`.
- `success`, `warning`, `danger`, and `info` each have `-fill`, `-fill-hover`, `-subtle`, `-border`, and `-text`.
- The shadcn names (`background`, `primary`, `muted-foreground`, `destructive`, and the rest) alias these roles. New code uses the roles.
- Fields sit on `field` (`surface-0` in light, `surface-1` in dark) with a `border-strong` border. `input` stays only for the vendored editor.
- Light surfaces are white on a gray `surface-sunken`. Dark surfaces step up in lightness, and dark borders are white at 6% and 9% alpha.
- `--brand` is the logo light-blue fill with ink text. `--primary` aliases `action`: a deeper blue with white text in light, and `brand` in dark.
- `danger-fill` keeps white text in both themes. The other dark fills carry ink text.
- Neutrals carry a faint navy tint (hue 256).

### Status and text colors

- Legacy status names (`success`, `warning`, `destructive`, `info`) alias the `*-fill` roles.
- Text uses the `*-text` tokens, since fills fail AA as text on white or their own tint.
- Status badges sit on `*-subtle`, because the generator checks `*-text` on `*-subtle` in both themes.
- Never put `text-muted-foreground/NN` on meaningful text.
- Fills, icons, and charts keep `brand`.

### Type roles

- The Tailwind numeric text scale is unchanged, because the vendored editor and the mobile textarea need `text-base` at 16px.
- Body text is `text-sm` (14px).
- Bricolage roles: `type-display` (36/40), `type-title` (28/34), `type-heading` (16/24), and `type-stage` (32/38, 44/48 from `lg`) for the one stage title of a page. Geist roles: `type-label` (13/20, 500) and `type-caption` (12/16).
- Name a type role `type-*`, never `text-*`. `cn()` reads an unknown `text-*` class as a color and drops it next to another color.

### Brand roles and fonts

- Brand roles: blue for primary actions, active navigation, focus, and links.
- Brand roles: olive for achievement and secondary data. Navy (`brand-tertiary-text` as text) for tertiary data.
- Status colors mark state only, never decoration.
- Never use raw Tailwind palette colors (`amber-500`) for state. Use `StatusBadge`, the `Badge` variants, or `bg-<status>-subtle text-<status>-text`.
- Fonts are variables on `<html>`: Geist (`--font-geist-sans`) for UI text and Bricolage Grotesque (`font-display`).
- `globals.css` applies `font-display` to `h1` to `h3` and every `[data-slot$='-title']`.
- `HeaderBreadcrumb` renders the page `h1` unless `backHref` is set. Then the content owns the only `h1`.
- `--ring` is `action` in light and `brand` in dark. The base outline is full strength in both themes.
- `--radius` is `0.6rem` with `sm`, `md`, `lg`, and `xl` derivatives.
- `globals.css` also defines a `text-stroke-*` utility (`@utility text-stroke-*`).
- The mobile breakpoint is 768px, sourced from `config/theme.json`.
- Email templates use their own Tailwind config in `src/emails/layout.tsx`, with hex values from `colors.generated.ts`: `EMAIL_COLORS` (light) and `EMAIL_COLORS_DARK`, each with `action`, `actionText`, `border`, `canvas`, `danger`, `faint`, `muted`, `onDanger`, `onFill`, `sunken`, `surface`, `text`, and `title`. Dark names carry a `-dark` suffix and apply through `dark:` classes. Class strings live in `src/emails/classes.ts` (`EMAIL_CLASSES`), so a template never writes a hex value. The `brand` color is the `action` blue, because email buttons carry white text.

## Controls

- Buttons, fields, and selects share one height scale: `2xs` 24px, `xs` 28px, `sm` 32px, `md` 36px (the default), and `lg` 44px.
- Icon buttons use the square sizes `icon-2xs`, `icon-xs`, `icon-sm`, `icon`, and `icon-lg` on the same scale.
- Set the `size` prop. Never override a control height with an `h-*` or `size-*` class.
- Fields keep 16px text below the `md` breakpoint, so iOS does not zoom on focus.
- Every focus indicator is `focus-visible:focus-ring`, a 2px `--ring` outline 2px outside the control.
- Fields and items in a clipped container use `focus-ring-inset`. Never build a focus indicator from `ring-*` or `border-ring`.
- A composite field such as `InputGroup` draws the ring on the group and passes `ring={false}` to its control.
- Inputs, textareas, selects, checkboxes, and radios use `border-border-strong` on `bg-field`. Outline buttons, badges, and toolbars use `border-border`.
- A checkbox is a rounded square (`rounded-sm`) and a radio is a circle. `checked="indeterminate"` shows a minus.
- `Switch` is a 36x20 track (`size="sm"`: 28x16) with a 2px inset, a thumb of track height minus 4px, and `action` when on. Both states move over 150ms with `--ease-out`.
- `PageIntro` takes `description`, `actions`, and children: a description row with an actions slot, then the page content, in one `gap-6` column.
- `CopyButton` takes `iconOnly`: a ghost icon button (`icon-sm`) whose `label` is its accessible name and tooltip, and "Copied" after a copy.
- `SHORTCUTS` also holds `submit` (Mod+Enter), `next` (j), and `previous` (k). `KbdShortcut` shows Enter as the return symbol.
- `MultiSelectTrigger` is 32px (the `FilterBar` control size) and shrinks with its container.
- `InlineInput` takes `size="title"` for the `type-title` role. Its placeholder uses the `placeholder:text-muted-foreground` input token.
- `Markdown` is a server component with a static `react-markdown` import. Use it from server components, where static content renders on the server.
- A client component uses `MarkdownLazy` (`markdown-lazy.tsx`), which loads `Markdown` with `next/dynamic` and no loading state, so `react-markdown` stays out of its route bundle. Call `preloadMarkdown()` when the client surface mounts, so the text appears with the content. Never import `Markdown` from a `'use client'` file.
- `DialogContent` keeps its close button in a sticky corner anchor, so it stays put while a long dialog scrolls. `DialogTitle` reserves space for it. On open, focus goes to an existing autofocus target, else to the first visible field outside the footer, else to the dialog itself. It never scrolls, and never lands on the close button or a link.
- `Badge` takes `count` (and `max`, default 99) for a counter: a pill with `tabular-nums` and a `min-w` equal to its height, capped as `99+`. Pass `count`, never `size-*` or `p-0`. Children render after the number, for a screen-reader label.
- `Progress` clamps its value to 0..100, animates the fill with a transform, and takes `color` `action`, `brand`, `brand-secondary`, `brand-tertiary`, `success`, `warning`, or `default`.
- A radio dot and its checked border use `action`. Tabs and segmented items darken their text on hover.
- Floating surfaces (dropdown, context menu, select, popover, hover card) share `shadow-md`. Dialog and alert dialog are `rounded-xl`, scroll within `100dvh - 2rem`, and close with a 32px icon button. Tooltips wait 200ms.
- An SVG gradient or pattern takes its id from `useId()`, so two copies on one page keep their fills.

## Elevation and motion

- The Tailwind shadow scale (`shadow-2xs` to `shadow-lg`) is overridden with layered shadows tinted by `--shadow-ink` and per-theme alpha tokens, so components keep standard classes.
- `--ease-out` and `--ease-in-out` replace the weak Tailwind defaults.
- JS animation uses `EASE_OUT`, `SPRING`, and `TRANSITION` from `src/lib/motion.ts`.
- `MotionProvider` sets `MotionConfig reducedMotion="user"` app-wide.
- Enter and exit animations come from `tw-animate-css`.
- Never use `transition-all`. List the animated properties.
- Theme switching uses the next-themes class strategy (`system`, `light`, `dark`) with the View Transitions API and respects `prefers-reduced-motion`.
- Route view transitions use React `<ViewTransition>` with no Next.js flag.
- `globals.css` suppresses the default root transition, so only a named `<ViewTransition>` with a transition type animates (for example `course-created` on course create).
- `AnimatedList` and `AnimatedListItem` (`src/components/ui/animated-list.tsx`) wrap `AnimatePresence mode="popLayout"`, with `variant` set to `card` or `row`.
- For dnd-kit sortable lists, add `asChild` and `exitOnly` and pair them with `animateLayoutChangesAlways` and `measureAlways` from `src/components/ui/sortable.tsx`.

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
- `LoadingFallback` is an `output` element with a translated label for screen readers. Pass `label={null}` outside the intl provider.
- A `Spinner` without `size` takes its size from the parent, as in a `Button`. Pass `size` when it stands alone.
- Put `animate-reveal` on content that replaces a loading state the user saw. It fades in for 150 ms and is off with reduced motion.
- A fade from opacity 0 delays LCP by its length, so content of a first render or a server stream paints at once. A component with a `loading` prop fades through `useReveal(loading)`.
- React holds a streamed boundary up to 300 ms after the first frame. `InstantReveal` in the root layout keeps `$RT` unset, so each boundary paints in the frame after it arrives.

## Design briefs

- Impeccable surface briefs live in `.impeccable/surfaces/`, one per surface, and stay untracked.
- The volunteer dashboard brief records the Journey rail direction chosen in #84.
- Impeccable mocks, reviews, and question state stay ignored.
