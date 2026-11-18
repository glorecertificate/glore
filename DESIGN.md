# Design system: brand-forward

GloRe looks like a confident, friendly product built around its brand: a navy shell, a teal and navy gradient band on every page, white cards on a pale blue canvas, and green for achievement. The owner chose this direction on 2026-11-18. Rules: `.agents/specs/ui.md`. Values: `config/theme.json`.

## Principles

- The brand carries the screen. Navy, teal, and green are always visible, in both themes.
- Content sits on cards. A page opens with the band, then cards pulled up over it.
- Color has a job. Teal means action. Green means earned or approved. Navy means current or in review. Amber means attention.
- One scale for type, space, radius, and shadow. No one-off values.
- Every press and hover answers within 100 ms.

## Palette

Light is direction B. Dark is direction E, "light blue" (owner decision, 2026-11-18).

| Role            | Light                           | Dark                               |
| --------------- | ------------------------------- | ---------------------------------- |
| Canvas          | `#e9f1f6`                       | `#0b1826`                          |
| Card            | `#ffffff`                       | `#12263a`                          |
| Sidebar         | `#16304f`                       | `#0f2234`                          |
| Active nav item | gradient `#107ea4` to `#0b6f92` | solid `#3bb6dc`, text `#04202f`    |
| Band gradient   | `#16304f`, `#1a5a82`, `#1f9ac4` | `#0f3550`, `#166c92`, `#2196bf`    |
| Primary button  | `#107ea4` to `#0b6f92`, white   | `#5cc4e4`, text `#04202f`          |
| Band action     | `#a2c439`, navy text            | `#8fd6ec`, text `#06202f`          |
| Highlight card  | navy gradient                   | `#13628a` to `#166f98`, white text |
| Earned panel    | green, teal, navy               | `#13628a`, `#2196bf`, `#5cc4e4`    |
| Approved pill   | `#a2c439`, navy text            | green tint, `#c9e27a` text         |
| Stat accents    | gradient tiles, white or navy   | tinted tiles, light accent text    |

The light action gradient starts at `#107ea4`, not the logo teal, because white text on `#24a7cf` is 2.8:1. The dark highlight stop is `#166f98` (spec `#2196bf`) so muted text keeps 4.5:1. `check:theme` verifies every pair in both themes.

## Type

- Bricolage Grotesque for the band title (34/40), stat numbers (34/38), and section titles (17/24). Geist for everything else.
- Body is 14px. Captions are 12px. The overline is 11px, uppercase, 0.06em.

## Shape and depth

- Cards are 14px, buttons and fields 10px, pills fully round.
- Cards use a soft 1px shadow. Stat cards and the highlight card lift with a long, tinted shadow. Primary buttons carry a teal glow.

## Components

- Shell: navy sidebar with a white logo chip, a teal gradient active item, and a green count badge.
- Page band: gradient, line-art globe at 20% opacity, breadcrumb, title, description, and actions. With `overlap`, an opaque card overlaps it by 64px. Otherwise the band ends with a clean gap.
- Stat card: 4px gradient strip, 32px gradient icon tile, large number, short context line.
- Highlight card: navy gradient with white text, for one key figure per page.
- Earned certificate: a green to teal to navy panel with the document tilted -2 degrees and a deep shadow.
- Charts: 3px lines with gradient areas, bars with a 4px radius, teal and green.

## Motion

- Buttons press to `scale(.98)` over 80 ms. Hover and color changes take 100 to 150 ms. Nothing exceeds 200 ms.
- All motion uses `--ease-out` and stops with reduced motion. The band, gradients, and globe are CSS and SVG only.
