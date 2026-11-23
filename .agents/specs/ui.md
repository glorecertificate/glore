# UI kit, theming, and motion

Release UI kit APIs, color and typography tokens, elevation, and motion. Component authoring rules: `patterns.md`.

## Quality bar

The owner set this bar on 2026-11-18. It is binding for every run and every lane. A reviewer checks each rule on a screenshot or in a browser.

- The UI is clean, solid, enterprise-grade, slick, smooth, and pleasant. The result must be beautiful.
- Reuse one type scale (`type-*` roles), one spacing rhythm, one radius scale, and one elevation scale. Never add a one-off value.
- Edges align. No orphan style, stray margin, or unstyled element is visible.
- Every empty, error, and edge state is designed: a message, a cause, and a next action.
- Light and dark are both crafted. Check each screen in both themes.

### Speed and motion

- Every press, hover, and focus answers within 100 ms.
- An action that waits shows a pending state on its own control. The control stays in place and blocks a second submit.
- Forms validate inline, next to the field. Use optimistic updates when the action is safe to undo.
- Page and section changes look instant. A warm navigation shows no spinner and no skeleton, and nothing flickers.
- Transitions last 200 ms or less. They respect reduced motion.

### Color, copy, and review

- Theme tokens drive every color. A raw palette class such as `bg-blue-500` or a hex value is a defect.
- The brand reads clearly in both modes. Check it against the tokens in "Color and typography".
- Copy and translations read as written by a person. Never ship AI-sounding text.
- Match Linear and GitHub on design-system quality: tokens, scale, spacing, components, consistency. Never copy their UI patterns.
- Every UI PR attaches before and after screenshots of real screens. The reviewer judges the PR on them before merge.
- "Looks the same" is a failed UI PR. Name the screens that changed and the screens that did not.
- A lane may change the shared kit in `src/components/ui/` when the bar needs it. It keeps the kit consistent and documents the change here and in `/dev/ui`.

## Direction B: brand-forward

The owner chose this look on 2026-11-18, with direction E (light blue) as the dark base. Dark keeps B's action gradient, glows, green band action, highlight and earned gradients. `.agents/references/design.md` holds the visual rules. Values live in `config/theme.json` (`system.palette`). `pnpm run theme` writes the tokens.

- Shell: a navy `--sidebar` (full height, no margin) with `sidebar-*` text, a `bg-sidebar-active` item (white at 12%, `sidebar-ring` icon), and `Logo onNavy` with no chip (`/icon-on-navy.png`).
- The bell sits in the logo row. `SidebarCount` shows a plain number, or a white badge when `floating`. `Sidebar` adds `dark sidebar-scope` to its root, so kit components inside it read the dark token set in both themes.
- Auth aside: one 32rem aside for every auth screen (`AuthFrame` in `features/auth/`) with a 165deg gradient of the `band-*` tokens, the white logo, a `type-display` headline and one subline (`Auth.asideTitle`, `Auth.asideMessage`), and 40px padding.
- The live `AuthGlobe` (about 760px, left -188px, masked toward the bottom) sits behind the text. The text is `pointer-events-none` so a drag reaches the canvas.
- The globe color follows `AuthGlobeContext` (`errored`, `view`), and `AuthFlow` resets it on unmount.
- In the pane, the language select is top right and the legal links and theme switch sit at the bottom, all 40px from the edges. The register step list renders above the form (`AuthMain` `header`).
- Below `lg`, the aside is the logo bar.

### Canvas, band, and controls

- Canvas: the page sits on `canvas` (`#e9f1f6`, dark `#0b1826`). Cards are `surface-1` with `shadow-card`. `--radius` is 10px, so cards are `rounded-xl` (14px) and controls `rounded-lg`.
- `DashboardHeader` renders `PageBand`: gradient `bg-band` (four stops from the sidebar navy to teal and green, no globe), `type-band` title (`h1`), description, `actions`, and a `breadcrumb` slot for tabs (`band-tabs`).
- The band is a token scope (`band-scope`): `foreground`, `muted-foreground`, `fg-*`, `border`, `input`, and `ring` read band tokens inside it.
- With `overlap`, `Main` is pulled up 64px over the band and its first block MUST be an opaque card. Without it, the band ends with a clean gap.
- `Button` `primary` and `brand` are the teal gradient with white text. `band` (green, navy text) and `band-secondary` (scrim) sit on the band. Press scales to `.98` in 80 ms.
- `StatCard` takes `accent` (`teal`, `navy`, `green`, `amber`) and `icon`: a flat 32px tile with accent-colored icon. `stat-accent-*` classes set the `--stat-*` variables for any element that needs them.
- `Badge` status variants (`success`, `warning`, `destructive`, `info`, `muted`, and the certificate ones such as `approved`) render an 8px dot and a neutral label, never a filled pill.
- `outline` is for neutral labels such as a role. `highlight` (`bg-highlight`) is the navy card, and `bg-earned-panel` with `shadow-deep` is the earned certificate panel.
- Text on a gradient passes 4.5:1 on its darkest stop in each theme. `check:theme` enforces every pair, and the table lives in `PALETTE_PAIRS` in `scripts/theme/tokens.ts`.

## Migrate a page to the band

Steps and an example: `.agents/references/ui-components.md`, "Migrate a page to the band".

## Release UI kit

- Shared primitives live in `src/components/ui/`. They accept root props and localized labels.
- `/dev/ui` (development and previews only) shows each primitive in each state, with the prop that sets the state as the row label. Add or update a specimen in `features/dev/` with each primitive change.
- Feature components own domain data and permission checks.

### Display primitives

- `ArrowsMotif` is decorative vector art from the certificate template, hidden from assistive technology.
- `LevelDots` takes a level, a number of `steps`, and a localized level label. It renders only after issue or in the tutor workspace.
- `Timeline` and `TimelineItem` compose dated entries, with ISO `dateTime` values and separately localized display times.
- `StatCard` shows its value at once, with no count-up. Formatting follows next-intl.
- A `DataTable` that refetches after a filter change keeps its rows as they are and shows a small spinner before the result count (`refreshing`). It never fades or covers the table.
- `Banner` supplies semantic status variants.
- `StatusBadge` takes a `tone`: `neutral`, `info`, `success`, `warning`, `danger`, or a certificate tone (`draft`, `submitted`, `review`, `changes`, `approved`, `rejected`, `withdrawn`, `revoked`). It takes no icon.
- `Progress` has one neutral track and a fill that matches the status color.

### FilterRail

- `FilterRail` (`filter-rail.tsx`) is passed to `DataTable` as `rail` (groups with live counts, `extra`, `search`, `onReset`). From `lg` it is a panel with active chips.
- Below `lg` it is a search field and a Filters sheet with the active count. Counts come from the server (`FacetedPage.facets`) or from the rows.
- A `FilterRail` group holds `values: string[]` and `onChange(values)`. A group is multi-select by default and renders checkboxes. Options in a group combine with OR.
- Groups combine with AND. An empty group means no filter. A group with every option ticked also filters nothing, and its boxes stay ticked.
- A checkbox always means multi-select.
- Set `selection: 'single'` only when the state truly holds one value. It renders a radio group with a Clear button. Set `selection: 'required'` for a group that always has one value, such as a queue tab.
- It has no clear button, no chip, and no count in the Filters badge.
- Each option count is a facet count: the other groups apply and this option stands alone in its own group.

### FilterRail chips and search

- Chips show one chip per selected option. Removing a chip unticks that option. The Filters badge counts groups with a selection.
- Reset clears every group.
- Courses Type, Skill group, and Language, the tutor queue Status, Translations State and Namespace, the admin users Role, Status, and Banned, the admin organizations Status and Country, the certificates list Status and Organization, the admin audit Category, and the admin certificates Status are multi-select.
- A long group sets `searchable: { emptyLabel, placeholder }`: a search field filters the options (case and accent insensitive), the ticked options stay on top, and the list scrolls.
- The admin users Organization group is first and uses it. Server-side groups read `parseAsArrayOf` params (an old single-value URL still parses), and the query uses OR inside the group.
- The courses Status tab and the tutor queue Age use `single`.

### Settings and status

- `SectionNav` is the left section nav of a settings page (vertical from `md`, a scroller below). `StickySaveBar` sticks to the bottom of the column when a form is dirty.
- Use `useStickySaveBar(form)` with react-hook-form: it gives `count`, `discard`, and `saving`.
- A domain status has one `StatusMeta` map (icon, label key, tone) in its feature folder. `CERTIFICATE_STATUS` lives in `features/certificates/status.ts`.
- Render a certificate status with `CertificateStatusBadge`, and read a status label from `CERTIFICATE_STATUS`. Never add a second map.

### Shortcuts and descriptions

- `Kbd` and `KbdGroup` render key hints. `useModifierKey()` returns `⌘` on Apple systems and `Ctrl` elsewhere. Never hard-code `⌘`.
- Every app shortcut is an entry of `SHORTCUTS` in `lib/shortcuts.ts`. Bind it with `useShortcut` and show it with `KbdShortcut`, so the key, the hint, and the matcher agree.
- A modifier shortcut needs Cmd or Ctrl and no Shift or Alt. A single-key shortcut, such as `/` (`Input` `hotkey`), never fires while focus is in a field.
- `DescriptionList` has three layouts: `stacked` (label above value, `columns={2}` from `sm`), `rows` (a 12rem label column with dividers), and `inline` (label left, value right).
- A `DescriptionItem` holds only its term and details. Put an action such as `CopyButton` inside `DescriptionDetails`.
- `EmptyDescription` renders a `p`, so pass phrasing content only.

### FilterBar and feedback

- `FilterBar` holds the controls of a filter row. Pass `active` and `onClear` to show "Clear filters" (`Common.clearFilters`).
- Pass `count` (active filters, search excluded) and `search` (the inline search field) to collapse the bar below `sm`: the search stays inline, and a Filters button shows the count and opens a bottom `Sheet` with the other controls.
- The sheet applies changes live and has Reset and Done. From `sm` the bar is unchanged. `size` matches the button to the controls (`md` or `sm`).
- Bars without `count` never collapse.
- After a clear, `FilterBar` moves focus to its first control, so focus never drops to the page.
- Import `toast` from `@/components/ui/toast`. Errors stay 8s, warnings 6s, info 4s, and success 2.5s. A caller can still set `duration`.
- `ShareButton` opens the native share sheet. Without one, it copies the URL and shows a toast. Use `CopyButton` when the action only copies.

### Tabs

- A tab switch never shows an empty or spinner-only panel.
- Pass every tab's data from the server in one payload, keep each panel mounted in `<Activity mode>` (`TabsContent forceMount`), and preload lazy chunks and client caches once on idle (`preloadAdminOrganizationDetail`, `preloadAllOrganizationTabs`, `prefetchCertificates`).
- A new tab with its own fetch joins that preload.

Reference: `DataTable`, `Chart`, shell layout, page container, page titles, and the org switcher are in `.agents/references/ui-components.md`.

## Color and typography

- `config/theme.json` (`system`) is the palette source. `pnpm run theme` writes `src/app/tokens.generated.css` and `src/emails/colors.generated.ts`. Never edit them by hand.
- `pnpm run check:theme` fails on a stale generated file or on a contrast pair below its minimum.
- The generator (`scripts/theme/`) solves text, fill, and ring lightness in OKLCH against the targets in `system.contrast`.
- Targets are 4.5:1 for text, 6:1 for `fg-2`, 5:1 for colored text, and 3:1 for non-text. Declare a pair in the generator before you use a new combination.

### Surface and text roles

- Surface roles: `surface-0` to `surface-3`, `surface-sunken` (canvas), `surface-muted`, `surface-hover`, `surface-highlight`, and `surface-selected`.
- `surface-hover` is the hover fill of cards and rows. In light it matches the outline button hover. `accent` (menu, select, and ghost highlights) uses `surface-highlight`.
- Text and border roles: `fg-1` to `fg-3`, `fg-disabled`, `fg-title` (navy), `fg-on-fill`, `fg-on-bright`, `fg-on-danger`, `border-subtle`, `border`, and `border-strong` (3:1).
- `action` (blue) marks actions only. It has `-hover`, `-subtle`, `-border`, and `-text`.
- `earned` (olive) marks earned seals, with `-subtle`, `-border`, and `-text`. `current-fill` (navy) marks the current stage, with `current-subtle`. Tailwind reserves `current` for `currentColor`.
- `success`, `warning`, `danger`, and `info` each have `-fill`, `-fill-hover`, `-subtle`, `-border`, and `-text`.
- The shadcn names (`background`, `primary`, `muted-foreground`, `destructive`, and the rest) alias these roles. New code uses the roles.

### Fields and fills

- Fields sit on `field` (`surface-0` in light, `surface-1` in dark) with a `border` border. Checkboxes and radios keep `border-strong`, because a light edge disappears at 16 px.
- `input` stays only for the vendored editor.
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
- Bricolage roles: `type-display` (36/40), `type-band` (28/34, 34/40 from `sm`, the band title), `type-stat` (34/38), `type-title` (28/34), and `type-heading` (17/24).
- Geist roles: `type-label` (13/20, 500), `type-caption` (12/16), and `type-overline` (11/16, uppercase).
- Name a type role `type-*`, never `text-*`. `cn()` reads an unknown `text-*` class as a color and drops it next to another color.

### Brand roles and fonts

- Brand roles: blue for primary actions, active navigation, focus, and links.
- Brand roles: olive for achievement and secondary data. Navy (`brand-tertiary-text` as text) for tertiary data.
- Status colors mark state only, never decoration.
- Never use raw Tailwind palette colors (`amber-500`) for state. Use `StatusBadge`, the `Badge` variants, or `bg-<status>-subtle text-<status>-text`.
- Fonts are variables on `<html>`: Geist (`--font-geist-sans`) for UI text and Bricolage Grotesque (`font-display`).
- `globals.css` applies `font-display` to `h1` to `h3` and every `[data-slot$='-title']`.
- `DashboardHeader` renders the page `h1` in the band. Content never adds a second `h1`.
- `--ring` is `action` in light and `brand` in dark. The base outline is full strength in both themes.
- `--radius` is `0.625rem` with `sm`, `md`, `lg`, and `xl` derivatives.
- `globals.css` also defines a `text-stroke-*` utility (`@utility text-stroke-*`).
- The mobile breakpoint is 768px and the tablet breakpoint is 1024px, both sourced from `config/theme.json`.
- Email templates take their colors from `EMAIL_COLORS` and `EMAIL_COLORS_DARK`. Detail: `.agents/references/ui-components.md`, "Email colors".

## Loading states

- A loading state either reproduces its content exactly, or it is a `Spinner`. Never ship an approximate `Skeleton`.
- Nothing moves when content arrives. The swap is a short fade, and instant with reduced motion.
- The header band never waits for data. A layout fallback is `DashboardLoading`, never a full-page spinner.
- When a page knows its header before its data loads, it renders `DashboardPage` once, outside its `Suspense`, so its fallback holds no second bar.
- A header part that needs data, such as the `/organization` tabs, gets its own `Suspense` with a small `Spinner`.
- Detail (exact skeletons, `loading` props, `InstantReveal`): `.agents/references/ui-components.md`, "Loading states".

## Moved detail

- Controls (height scale, focus rings, fields, switches, floating surfaces) and Elevation and motion (shadows, easing, view transitions, animated lists): `.agents/references/ui-kit.md`.
- `Markdown`, `MarkdownLazy`, `DialogContent`, and `InlineInput` rules: `.agents/references/ui-components.md`, "Controls detail".
- Layout rules (cards, tab lists, `SegmentedControl`, `CopyButton`, `QrCode`, `AvatarStack`, skill group tones, charts): `.agents/references/ui-components.md`, "Layout rules".

## Design briefs

- The volunteer dashboard uses the Journey rail direction chosen in #84 (`features/dashboard/journey-*.tsx`).
