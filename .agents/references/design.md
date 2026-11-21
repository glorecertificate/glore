# Visual rules: brand-forward

GloRe looks like a confident, friendly product built around its brand: a navy shell, a teal and navy gradient band on every page, white cards on a pale blue canvas, and green for achievement. The owner chose this direction on 2026-11-18. Rules: `.agents/specs/ui.md`. Values: `config/theme.json`.

## Principles

- The brand carries the screen. Navy, teal, and green are always visible, in both themes.
- Content sits on cards. A page opens with the band, then cards pulled up over it.
- Color has a job. Teal means action. Green means earned or approved. Navy means current or in review. Amber means attention.
- One scale for type, space, radius, and shadow. No one-off values.
- Every press and hover answers within 100 ms.

## Palette

Light is direction B. Dark is direction E (light blue base) with B's gradients and green touches kept (owner decision, 2026-11-18).

| Role            | Light                                       | Dark                                       |
| --------------- | ------------------------------------------- | ------------------------------------------ |
| Canvas          | `#e9f1f6`                                   | `#0b1826`                                  |
| Card            | `#ffffff`                                   | `#12263a`                                  |
| Sidebar         | `#16304f`                                   | `#0f2234`                                  |
| Active nav item | white at 12%, white text, `#7fd0e8` icon    | same                                       |
| Band gradient   | `#16304f`, `#1b4d74`, `#13607f`, `#2a6f60`  | `#0f2234`, `#134260`, `#0f5570`, `#1f5e55` |
| Primary button  | `#107ea4` to `#0b6f92`, white               | same gradient, white text, glow            |
| Band action     | `#a2c439`, navy text                        | same green, navy text                      |
| Highlight card  | navy gradient                               | `#0f2a47` to `#164c72`, white text         |
| Earned panel    | green, teal, navy                           | `#8fb32a`, `#1d90b5`, `#0b1c33`            |
| Status dot      | one dot color per status, neutral ink label | brighter dot colors                        |
| Stat accents    | gradient tiles, white or navy               | tinted tiles, light accent text            |

The light action gradient starts at `#107ea4`, not the logo teal, because white text on `#24a7cf` is 2.8:1. `check:theme` verifies every pair in both themes.

## Type

- Bricolage Grotesque for the band title (34/40), stat numbers (34/38), and section titles (17/24). Geist for everything else.
- Body is 14px. Captions are 12px. The overline is 11px, uppercase, 0.06em.

## Shape and depth

- Cards are 14px, buttons and fields 10px, pills fully round.
- Cards use a soft 1px shadow. Stat cards and the highlight card lift with a long, tinted shadow. Primary buttons carry a teal glow.

## Components

- Shell: navy sidebar with no logo chip (light letters and a recolored mark), a bell in the logo row, a translucent active item, and plain counts. The band starts at the sidebar navy and ends in teal and green, so the two join with no seam.
- Page band: gradient with no globe, breadcrumb row level with the logo row, title level with the first nav item, description, and actions. The content column is centered at 1184px. With `overlap`, an opaque card overlaps it by 64px. Otherwise the band ends with a clean gap.
- Stat card: 4px gradient strip, 32px gradient icon tile, large number, short context line.
- Highlight card: navy gradient with white text, for one key figure per page.
- Earned certificate: a green to teal to navy panel with the document tilted -2 degrees and a deep shadow.
- Charts: 3px lines with gradient areas, bars with a 4px radius, teal and green.

## Motion

- Buttons press to `scale(.98)` over 80 ms. Hover and color changes take 100 to 150 ms. Nothing exceeds 200 ms.
- All motion uses `--ease-out` and stops with reduced motion. The band, gradients, and globe are CSS and SVG only.

## Status, forms, and lists

- Status: an 8px dot on a neutral ink label, never a filled pill. One palette maps each status to one color (`status-*` tokens). Bars use one neutral track (`status-track`) and a fill in the status color.
- Forms: outlined fields, labels above, help and error text below (the error has an alert icon). Dialogs are left aligned. The primary button is the teal gradient and secondary buttons are outlined.
- Lists: a filter rail with counts at `lg` and up (search, facet groups, reset, active chips). Below `lg` it collapses into the Filters sheet.
