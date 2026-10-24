# UI kit, theming, and motion

Release UI kit APIs, color and typography tokens, elevation, and motion. Component authoring rules: `patterns.md`.

## Release UI kit

- Shared primitives live in `src/components/ui/`. They accept root props and localized labels.
- Feature components own domain data and permission checks.
- `ArrowsMotif` uses vector paths extracted from the certificate template. It is decorative and hidden from assistive technology.
- `LevelDots` takes a level from 1 to 5 and a localized level label.
- `Timeline` and `TimelineItem` compose dated entries, with ISO `dateTime` values and separately localized display times.
- `StatCard` composes `NumberTicker`. Formatting follows next-intl, and the ticker respects reduced motion.
- `Banner` supplies semantic status variants.

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
- Pass `pagination` (page, pageCount, total, onPageChange) for server-paged rows.
- Below `sm` each row becomes a labeled card (cells carry `data-label`), so status and actions stay reachable.
- Below `sm` a compact sort select plus a direction toggle replaces the hidden column sorts (`data-table-sort.ts`).

### Chart

- `Chart` loads `chart-renderer.tsx` through `next/dynamic` with a local skeleton.
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

### Org switcher and palette

- The org switcher (`organization-switcher.tsx`) reuses the active-org mechanism: `useSession().setOrganization` writes the `org` cookie that `getActiveOrgId` reads.
- It lists memberships, the viewer's pending invitations (`listMyPendingInvitations`, polled every 2 minutes, links to `/api/v1/invitations/[id]`), and a link to `/register`.
- It offers Leave for non-owners through `LeaveOrganizationDialog` (`leaveOrganization`, gotcha 16).
- The palette opens with the `searchShortcut` key of `config/app.json` (plus Cmd or Ctrl).
- Courses and docs filter in the browser (`listCourses`, `useDocsSearch`).
- Certificates and members come from `searchWorkspace` (`actions/shell/search.ts`), which scopes server-side.
- Certificate scope: own certificates for everyone but team members, assigned and pooled `submitted` requests for tutors, and every non-draft certificate of the active organization for owners and representatives.
- Member scope: owners and representatives in the active organization only.
- Team members get neither. Drafts are visible to their holder only. Queries shorter than 2 characters return nothing.
- The bell stays in the sidebar's top group under Search, as the second row.

## Color and typography

- Color is OKLCH through CSS custom properties in `src/app/globals.css`, with light and dark blocks.
- The palette comes from the logo.
- `--brand` is the logo light-blue in both themes (slightly deeper in light) with an ink foreground.
- `--brand-secondary` is olive (dark foreground). `--brand-tertiary` is navy.
- `--primary` is a deeper, AA-safe brand blue with white text in light mode (`oklch(0.56 0.11 228)`, 4.5:1).
- In dark mode `--primary` equals `--brand`, so default buttons, checked controls, and selected chips use the brand color.
- `--secondary` is the dark navy fill. Neutrals carry a faint navy tint (hue 256).
- Every text and fill pair meets WCAG AA. Check new pairs before adding them.

### Status and text colors

- Status colors (`success`, `warning`, `destructive`, `info`) are tokens.
- Text uses their `*-text` tokens plus `brand-text`, `brand-secondary-text`, and `brand-tertiary-text`, since fills fail AA as text on white or their own tint.
- Never put `text-muted-foreground/NN` on meaningful text.
- Fills, icons, and charts keep `brand`.

### Brand roles and fonts

- Brand roles: blue for primary actions, active navigation, focus, and links.
- Brand roles: olive for achievement and secondary data. Navy (`brand-tertiary-text` as text) for tertiary data.
- Status colors mark state only, never decoration.
- Never use raw Tailwind palette colors (`amber-500`) for state. Use the `Badge` variants (`success`, `warning`, `destructive`, `info`, `brand-soft`) or `bg-<status>/10 text-<status>-text`.
- Fonts are variables on `<html>`: Geist (`--font-geist-sans`) for UI text and Bricolage Grotesque (`font-display`).
- `globals.css` applies `font-display` to `h1` to `h3` and every `[data-slot$='-title']`.
- `HeaderBreadcrumb` renders the page `h1` unless `backHref` is set. Then the content owns the only `h1`.
- Light `--ring` is 3:1 or better on white. The base outline is full strength in light and 50% in dark.
- `--radius` is `0.6rem` with `sm`, `md`, `lg`, and `xl` derivatives.
- `globals.css` also defines a `text-stroke-*` utility (`@utility text-stroke-*`).
- The mobile breakpoint is 768px, sourced from `config/theme.json`.
- Email templates use their own Tailwind config in `src/emails/layout.tsx`. Its `brand` hex stays the deep teal `#267997`, because email buttons carry white text.

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
