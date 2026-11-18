# Design system: brand-forward

GloRe looks like a confident, friendly product built around its brand: a navy shell, a teal and navy gradient band on every page, white cards on a pale blue canvas, and green for achievement. The owner chose this direction on 2026-11-18. Rules: `.agents/specs/ui.md`. Values: `config/theme.json`.

## Principles

- The brand carries the screen. Navy, teal, and green are always visible, in both themes.
- Content sits on cards. A page opens with the band, then cards pulled up over it.
- Color has a job. Teal means action. Green means earned or approved. Navy means current or in review. Amber means attention.
- One scale for type, space, radius, and shadow. No one-off values.
- Every press and hover answers within 100 ms.

## Palette

| Role            | Light                           | Dark                            |
| --------------- | ------------------------------- | ------------------------------- |
| Canvas          | `#e9f1f6`                       | `#0b1522`                       |
| Card            | `#ffffff`                       | `#12233a`                       |
| Sidebar         | `#16304f`                       | `#08111d`                       |
| Band gradient   | `#16304f`, `#1a5a82`, `#1f9ac4` | `#0a1a2e`, `#123a5c`, `#1a7fa6` |
| Action gradient | `#107ea4` to `#0b6f92`          | same                            |
| Band action     | `#a2c439` with navy text        | same                            |
| Approved pill   | `#a2c439` with navy text        | same                            |
| In review pill  | navy with white text            | `#2d5582`                       |
| Draft pill      | `#e6edf3`, `#46586e` text       | `#1f3555`, `#b4c3d6`            |
| Stat accents    | teal, navy, green, amber        | same tiles, lighter text        |

The action gradient starts at `#107ea4`, not the logo teal, because white text on `#24a7cf` is 2.8:1. Every text pair is checked by `pnpm run check:theme`.

## Type

- Bricolage Grotesque for the band title (34/40), stat numbers (34/38), and section titles (17/24). Geist for everything else.
- Body is 14px. Captions are 12px. The overline is 11px, uppercase, 0.06em.

## Shape and depth

- Cards are 14px, buttons and fields 10px, pills fully round.
- Cards use a soft 1px shadow. Stat cards and the highlight card lift with a long, tinted shadow. Primary buttons carry a teal glow.

## Components

- Shell: navy sidebar with a white logo chip, a teal gradient active item, and a green count badge.
- Page band: gradient, line-art globe at 20% opacity, breadcrumb, title, description, and actions. Content overlaps it by 64px.
- Stat card: 4px gradient strip, 32px gradient icon tile, large number, short context line.
- Highlight card: navy gradient with white text, for one key figure per page.
- Earned certificate: a green to teal to navy panel with the document tilted -2 degrees and a deep shadow.
- Charts: 3px lines with gradient areas, bars with a 4px radius, teal and green.

## Motion

- Buttons press to `scale(.98)` over 80 ms. Hover and color changes take 100 to 150 ms. Nothing exceeds 200 ms.
- All motion uses `--ease-out` and stops with reduced motion. The band, gradients, and globe are CSS and SVG only.
