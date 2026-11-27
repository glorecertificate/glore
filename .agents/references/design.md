# Visual rules: B evolved

GloRe looks like a calm, confident product built around its brand: a navy shell, flat page headers on a pale canvas, white cards, one teal accent, and green for achievement. The owner chose brand-forward B on 2026-11-18 and its evolution A ("B evolved") on 2026-11-27. Rules: `.agents/specs/ui.md`. Values: `config/theme.json`.

## Principles

- The brand lives in the sidebar, the mark, and one accent. Neutrals carry the rest of the screen.
- Content sits on cards. A page opens with a flat title row on the canvas, then cards.
- Color has a job. Teal means action. Green means earned or approved. Navy means current or in review. Amber means attention.
- Gradients appear only in two signature spots: the auth aside and the earned certificate panel.
- One scale for type, space, radius, and shadow. No one-off values.
- Every press and hover answers within 100 ms.

## Palette

Light is direction A. Dark derives from direction E (light blue base) with A's flat rules (owner decision, 2026-11-27).

| Role            | Light                                       | Dark                                       |
| --------------- | ------------------------------------------- | ------------------------------------------ |
| Canvas          | `#f3f6f9`                                   | `#0b1826`                                  |
| Card            | `#ffffff`                                   | `#12263a`                                  |
| Sidebar         | `#16304f`                                   | `#0f2234`                                  |
| Active nav item | white at 12%, white text, `#7fd0e8` icon    | same                                       |
| Page header     | flat canvas, navy title, `#566272` text     | flat canvas, `#f1f5f9` title               |
| Auth aside      | `#16304f`, `#1b4d74`, `#13607f`, `#2a6f60`  | `#0f2234`, `#134260`, `#0f5570`, `#1f5e55` |
| Primary button  | flat `#107ea4`, white, no glow              | same                                       |
| Band action     | flat `#107ea4`, white, hover `#0b6f92`      | same                                       |
| Highlight card  | flat navy `#16304f`                         | flat `#0f2a47`, white text                 |
| Earned panel    | green, teal, navy                           | `#8fb32a`, `#1d90b5`, `#0b1c33`            |
| Status dot      | one dot color per status, neutral ink label | brighter dot colors                        |
| Stat accents    | flat muted tile, accent icon                | tinted tiles, light accent text            |

The action color is `#107ea4`, not the logo teal, because white text on `#24a7cf` is 2.8:1. `check:theme` verifies every pair in both themes.

## Type

- Bricolage Grotesque for the page title (34/40), stat numbers (34/38), and section titles (17/24). Geist for everything else.
- Body is 14px. Captions are 12px. The overline is 11px, uppercase, 0.06em.

## Shape and depth

- Cards are 14px, buttons and fields 10px, pills fully round.
- Cards and stat cards use a soft 1px shadow. Only the earned panel lifts with a deep shadow. Buttons carry no glow.

## Components

- Shell: navy sidebar with no logo chip (light letters and a recolored mark), a bell in the logo row, a translucent active item, and plain counts.
- Page header (`PageBand`): flat on the canvas, breadcrumb row level with the logo row, title level with the first nav item, description, and actions. The content column is centered at 1184px. With `overlap`, the first card sits 32px under the title. Otherwise the header ends with a 40px gap.
- Stat card: flat, with a 32px muted icon tile in the accent text color, a large number, and a short context line.
- Highlight card: flat navy with white text, for one key figure per page.
- Earned certificate: a green to teal to navy panel with the document tilted -2 degrees and a deep shadow.
- Charts: 3px lines with gradient areas, bars with a 4px radius, teal and green. The area fade is a data encoding, not a brand gradient.

## Motion

- Buttons press to `scale(.98)` over 80 ms. Hover and color changes take 100 to 150 ms. Nothing exceeds 200 ms.
- All motion uses `--ease-out` and stops with reduced motion. The aside gradient and the globe are CSS and SVG only.

## Status, forms, and lists

- Status: an 8px dot on a neutral ink label, never a filled pill. One palette maps each status to one color (`status-*` tokens). Bars use one neutral track (`status-track`) and a fill in the status color.
- Forms: outlined fields, labels above, help and error text below (the error has an alert icon). Dialogs are left aligned. The primary button is flat teal and secondary buttons are outlined.
- Lists: a filter rail with counts at `lg` and up (search, facet groups, reset, active chips). Below `lg` it collapses into the Filters sheet.
