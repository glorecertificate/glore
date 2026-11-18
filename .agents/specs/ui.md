# UI kit, theming, and motion

Release UI kit APIs, color and typography tokens, elevation, and motion. Component authoring rules: `patterns.md`.

## Quality bar

The owner set this bar on 2026-11-18. It is binding for every run and every lane. A reviewer checks each rule on a screenshot or in a browser.

- The UI is clean, solid, enterprise-grade, slick, smooth, and pleasant. The result must be beautiful.
- Reuse one type scale (`type-*` roles), one spacing rhythm, one radius scale, and one elevation scale. Never add a one-off value.
- Edges align. No orphan style, stray margin, or unstyled element is visible.
- Every empty, error, and edge state is designed: a message, a cause, and a next action.
- Light and dark are both crafted. Check each screen in both themes.
- Every press, hover, and focus answers within 100 ms.
- An action that waits shows a pending state on its own control. The control stays in place and blocks a second submit.
- Forms validate inline, next to the field. Use optimistic updates when the action is safe to undo.
- Page and section changes look instant. A warm navigation shows no spinner and no skeleton, and nothing flickers.
- Transitions last 200 ms or less. They respect reduced motion.
- Theme tokens drive every color. A raw palette class such as `bg-blue-500` or a hex value is a defect.
- The brand reads clearly in both modes. Check it against the tokens in "Color and typography".
- Copy and translations read as written by a person. Never ship AI-sounding text.
- Match Linear and GitHub on design-system quality: tokens, scale, spacing, components, consistency. Never copy their UI patterns.
- Every UI PR attaches before and after screenshots of real screens. The reviewer judges the PR on them before merge.
- "Looks the same" is a failed UI PR. Name the screens that changed and the screens that did not.
- A lane may change the shared kit in `src/components/ui/` when the bar needs it. It keeps the kit consistent and documents the change here and in `/dev/ui`.

## Direction B: brand-forward

The owner chose this look on 2026-11-18, with direction E (light blue) for dark mode. Dark differs in tokens only: solid `nav-from` active item, `action-*` light blue with dark `action-foreground` text, a light blue `band-action`, and tinted stat tiles and pills. `DESIGN.md` holds the visual rules. Every value lives in `config/theme.json` (`system.palette`, a light and a dark hex per token), and `pnpm run theme` writes the tokens.

- Shell: a navy `--sidebar` (full height, no margin) with `sidebar-*` text, a teal gradient active item (`bg-gradient-action`, `shadow-glow-nav`), a white `logo-chip`, and a green `sidebar-badge` count. `Sidebar` adds `dark sidebar-scope` to its root, so kit components inside it read the dark token set in both themes.
- Canvas: the page sits on `canvas` (`#e9f1f6`, dark `#0b1522`). Cards are `surface-1` with `shadow-card`. `--radius` is 10px, so cards are `rounded-xl` (14px) and controls `rounded-lg`.
- `DashboardHeader` renders `PageBand`: gradient `bg-band`, inline SVG globe, breadcrumb, `type-band` title (`h1`), description, `actions`, and a `breadcrumb` slot for tabs (`band-tabs`). The band is a token scope (`band-scope`): `foreground`, `muted-foreground`, `fg-*`, `border`, `input`, and `ring` read band tokens inside it. `DashboardPage` takes `actions`, `description`, `title`, `breadcrumb` (tabs, always inside the band), `header` (for a band that needs data, such as `DashboardBand`), and `overlap`. With `overlap`, `Main` is pulled up 64px over the band and its first block MUST be an opaque card (`Card`, `StatCard`, `DataTable`, `Banner`). Without it, the band ends after its description with a clean gap and the content starts on the canvas. Filters and tabs never straddle the band edge.
- `Button` `primary` and `brand` are the teal gradient with white text. `band` (green, navy text) and `band-secondary` (scrim) sit on the band. Press scales to `.98` in 80 ms.
- `StatCard` takes `accent` (`teal`, `navy`, `green`, `amber`) and `icon`: a 4px gradient strip and a 32px gradient tile. `stat-accent-*` classes set the `--stat-*` variables for any element that needs them.
- `Badge` is a pill. `success` is green with navy text, `info` is navy with white text, `muted` is the draft grey. `highlight` (`bg-highlight`) is the navy card, and `bg-earned-panel` with `shadow-deep` is the earned certificate panel.
- `Chart` draws 3px lines with gradient areas and bars with a 4px radius, from `chart-teal` and `chart-green`.
- `PageIntro` stays in the content on the canvas. Prefer a `description` and `actions` on `DashboardPage`.
- Text on a gradient passes 4.5:1 on its darkest stop in each theme. `check:theme` enforces every pair, and the table lives in `PALETTE_PAIRS` in `scripts/theme/tokens.ts`.

## Release UI kit

- Shared primitives live in `src/components/ui/`. They accept root props and localized labels.
- `/dev/ui` (development and previews only) shows each primitive in each state, with the prop that sets the state as the row label. Add or update a specimen in `features/dev/` with each primitive change.
- Feature components own domain data and permission checks.
- `ArrowsMotif` is decorative vector art from the certificate template, hidden from assistive technology.
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

Reference: `DataTable`, `Chart`, shell layout, page container, page titles, and the org switcher are in `.agents/references/ui-components.md`.

## Color and typography

- `config/theme.json` (`system`) is the palette source. `pnpm run theme` writes `src/styles/tokens.generated.css` and `src/emails/colors.generated.ts`. Never edit them by hand.
- `pnpm run check:theme` fails on a stale generated file or on a contrast pair below its minimum.
- The generator (`scripts/theme/`) solves text, fill, and ring lightness in OKLCH against the targets in `system.contrast`.
- Targets are 4.5:1 for text, 6:1 for `fg-2`, 5:1 for colored text, and 3:1 for non-text. Declare a pair in the generator before you use a new combination.
- Surface roles: `surface-0` to `surface-3`, `surface-sunken` (canvas), `surface-muted`, `surface-hover`, and `surface-selected`.
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
- Bricolage roles: `type-display` (36/40), `type-band` (28/34, 34/40 from `sm`, the band title), `type-stat` (34/38), `type-title` (28/34), `type-heading` (17/24), and `type-stage` (32/38, 44/48 from `lg`) for the one stage title of a page. Geist roles: `type-label` (13/20, 500), `type-caption` (12/16), and `type-overline` (11/16, uppercase).
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
- The mobile breakpoint is 768px, sourced from `config/theme.json`.
- Email templates take their colors from `EMAIL_COLORS` and `EMAIL_COLORS_DARK`. Detail: `.agents/references/ui-components.md`, "Email colors".

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

- A loading state either reproduces its content exactly, or it is a `Spinner`. Never ship an approximate `Skeleton`.
- Nothing moves when content arrives. The swap is a short fade, and instant with reduced motion.
- The header band never waits for data. A layout fallback is `DashboardLoading`, never a full-page spinner.
- Detail (exact skeletons, `loading` props, `InstantReveal`): `.agents/references/ui-components.md`, "Loading states".

## Moved detail

- `Markdown`, `MarkdownLazy`, `DialogContent`, and `InlineInput` rules: `.agents/references/ui-components.md`, "Controls detail".

## Design briefs

- Impeccable surface briefs live in `.impeccable/surfaces/`, one per surface, and stay untracked.
- The volunteer dashboard brief records the Journey rail direction chosen in #84.
