# UI kit detail

Moved from `.agents/specs/ui.md`. The rules there still apply.

## Controls

- Buttons, fields, and selects share one height scale: `2xs` 24px, `xs` 28px, `sm` 32px, `md` 36px (the default), and `lg` 44px.
- Icon buttons use the square sizes `icon-2xs`, `icon-xs`, `icon-sm`, `icon`, and `icon-lg` on the same scale.
- Set the `size` prop. Never override a control height with an `h-*` or `size-*` class.
- Fields keep 16px text below the `md` breakpoint and on every coarse pointer, so iOS and iPadOS do not zoom on focus.
- Controls keep their visible size on touch. The `touch-hit` utility adds an invisible 44px hit area. Touch growth is exactly 44px, and touch gaps only prevent overlapping hit areas. Mobile and touch rules: `.agents/references/ui-components.md`, "Mobile and touch".
- Every focus indicator is `focus-visible:focus-ring`, a 2px `--ring` outline 2px outside the control.
- Fields and items in a clipped container use `focus-ring-inset`. Never build a focus indicator from `ring-*` or `border-ring`.
- A composite field such as `InputGroup` draws the ring on the group and passes `ring={false}` to its control.
- Inputs, textareas, selects, and outline, secondary and field buttons use `border-border` on `bg-field`. Checkboxes and radios use `border-border-strong`. Badges and toolbars use `border-border`.
- A checkbox is a rounded square (`rounded-sm`) and a radio is a circle. `checked="indeterminate"` shows a minus.
- `Switch` is a 36x20 track (`size="sm"`: 28x16) with a 2px inset, a thumb of track height minus 4px, and `action` when on. Both states move over 150ms with `--ease-out`.
- `PageIntro` takes `description`, `actions`, and children: a description row with an actions slot, then the page content, in one `gap-6` column.
- `CopyButton` takes `iconOnly`: a ghost icon button (`icon-sm`) whose `label` is its accessible name and tooltip, and "Copied" after a copy.
- `SHORTCUTS` also holds `submit` (Mod+Enter), `next` (j), and `previous` (k). `KbdShortcut` shows Enter as the return symbol.
- `MultiSelectTrigger` is 32px (the `FilterBar` control size) and shrinks with its container.
- `Badge` takes `count` (and `max`, default 99) for a counter: a pill with `tabular-nums` and a `min-w` equal to its height, capped as `99+`. Pass `count`, never `size-*` or `p-0`. Children render after the number, for a screen-reader label.
- `Progress` clamps its value to 0..100, animates the fill with a transform, and takes `color` `action`, `brand`, `brand-secondary`, `brand-tertiary`, `success`, `warning`, or `default`.
- A radio dot and its checked border use `action`. Tabs and segmented items darken their text on hover.
- Floating surfaces (dropdown, context menu, select, popover, hover card) share `shadow-md`. Dialog and alert dialog are `rounded-xl`, scroll within `100dvh - 2rem`, and close with a 32px icon button. Below `sm` they are bottom sheets with a sticky footer. Tooltips wait 200ms.
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
- `globals.css` suppresses the default root transition, so only a named `<ViewTransition>` with a transition type animates (for example `course-created` on course create, and `auth-view` on a switch between login and forgot password). An `update` or `enter` class with no type also runs on a streamed Suspense reveal and on router updates after hydration, so the content blinks on each page load.
- `AnimatedList` and `AnimatedListItem` (`src/components/ui/animated-list.tsx`) wrap `AnimatePresence mode="popLayout"`, with `variant` set to `card` or `row`.
- For dnd-kit sortable lists, add `asChild` and `exitOnly` and pair them with `animateLayoutChangesAlways` and `measureAlways` from `src/components/ui/sortable.tsx`.
