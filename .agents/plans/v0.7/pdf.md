# GloRe v0.7 release: certificate PDF

Layout reference for task A5, measured from `.agents/references/certificate-template.pdf` with PyMuPDF on 2026-10-22.

The template is A4 portrait (595.3 by 841.9 pt) from Adobe Illustrator 26. Coordinates are points from the top-left corner; "top" is the top of the text box.

## Tokens

| Token       | Value                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Navy text   | `#315070` (names `#305071`)                                                                    |
| Green       | `#7fbf73` (bars, skill labels, filled dots, "SOFT SKILLS" in the heading, bullets, level word) |
| Gray        | `#f0f0f0` (empty dots, icon and logo placeholders)                                             |
| Level label | `#3c4045`                                                                                      |
| Banner fill | `#345372`                                                                                      |
| Logo colors | blue `#5ab9cf`, olive `#afc761`, teal `#397b97`, navy `#304f71`                                |
| Fonts       | Roboto Regular, Bold, Black (bundle the TTFs locally)                                          |
| Logo fonts  | Avenir Next Condensed DemiBold and Tw Cen MT: ship the logo as vector paths, never as text     |
| Dates       | `DD.MM.YYYY` in every language                                                                 |

## Text placement

- A template "top" is the PyMuPDF line bbox top, which uses the template font descriptor ascent (1.056 x font size).
- react-pdf puts the first baseline at top plus the Roboto hhea ascent (1900 / 2048 = 0.928 x font size) whatever the line height.
- `placed(top, size)` in `document.tsx` therefore adds 0.128 x size to every template top.
- The template is slightly irregular: its first skill block sits 1 pt higher relative to its statement, dots, and level line than blocks 2 to 4 do.
- Statement and level text use the midpoint of both. The dots keep the first block's 85.1, so blocks 2 to 4 have dots 1 pt low.
- Headings carry +0.73 pt tracking, the banner text about -0.2 pt, and skill labels end 14.8 pt after the name. The level line is one text run, "level: good", with a regular word space.
- Underlines in the From, hours, at, and Represent rows sit 0.7 pt above the template lines, kept in place so values still sit on them.

## Left column

| Element              | Spec                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logo                 | "THE GLORE NETWORK" with the arrow globe, x 24 to 233, y 23 to 102.                                                                              |
| Banner               | Box `#345372` x 24.7 to 219.0, y 105.3 to 128.0. White Roboto Regular caps about 15.9 pt, x 29.4 to 214.3: "SOFT SKILLS CERTIFICATE", localized. |
| Name                 | First name Roboto Regular 36 pt at x 23.6, top 137.0. Last name Roboto Bold 36 pt at x 23.6, top 173.0.                                          |
| Personal block       | Green bar x 26.9 to 29.7, y 230.3 to 269.0. Lines at x 45.3, tops 227.0, 243.0, 259.0: label Regular 9 pt plus value Black 9 pt uppercase.       |
| Personal labels      | "Nationality:", "Date of birth:", "Place of birth:".                                                                                             |
| Section bars         | Navy x 26.9 to 29.7: y 299.0 to 472.9 (Volunteering) and y 503.3 to 687.7 (Main tasks).                                                          |
| Volunteering heading | "VOLUNTEERING" Roboto Black 13.2 pt at x 46.1, top 296.1.                                                                                        |
| Period row           | Top 322.8: "From", line x 70.2 to 124.1, "to", line x 138.8 to 220.9. Lines 0.75 pt navy at y 333.1.                                             |
| Hours row            | Top 340.8: "hours", line x 72.6 to 124.1 at y 351.0.                                                                                             |
| Location row         | Top 358.8: "at", line x 56.8 to 220.9 at y 369.0.                                                                                                |
| Row values           | Roboto Bold 10 pt navy, sitting just above each line.                                                                                            |
| Partner              | "In partnership with" Regular 10 pt at top 385.1. Org name Black 10 pt from top 417.2, wrapping within x 46 to 112.                              |
| Partner logo         | Slot x 119.2 to 209.9, y 418.0 to 472.6, contain-fit. The gray placeholder shows only when the org has no logo.                                  |
| Tasks heading        | "MAIN TASKS" Roboto Black 13.2 pt at x 46.1, top 499.0.                                                                                          |
| Tasks intro          | Two lines Regular 10 pt at top 521.6, line height 13: "During the volunteering period I carried out the following activities:".                  |
| Task bullets         | Green Black "•" plus Regular 10 pt, line height 12, pitch 40 from top 550.6, text within x 46.3 to 205. Up to 4 tasks of 110 chars.              |
| Signatory            | "Represented by" Regular 10 pt at x 46.1, top 676.8; line x 109.5 to 217.4 at y 687.3. Name above the line; optional signature image above it.   |
| Date                 | "DATE 01.01.2022" Roboto Black 10 pt at x 46.1, top 708.3.                                                                                       |
| Verification (U3)    | QR 52 pt square at x 46.1, top 735. To its right: Regular 7.5 pt navy "Verify this certificate" and the short URL, code in Black 8 pt.           |

## Right column

| Element          | Spec                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background       | Faded arrows group x 256 to 575, y 20 to 325. The template uses group transparency; reproduce with an opacity wrapper.                                              |
| Heading          | Roboto Bold 11 pt at x 264.8, tops 187.0 and 200.2: "Recognizes that the following " navy, "SOFT SKILLS" green, " have been / demonstrated by the volunteer:" navy. |
| Skill block tops | 226.5, 355.1, 482.7, 610.3 (pitch about 127.9). With 3 skills the fourth block is omitted and spacing stays.                                                        |
| Skill label      | Green box from x 269.3, height 22.9, width fitting the name (template 109.1).                                                                                       |
| Skill icon       | Slot 14.6 by 14.3 at x 276.3, 5.3 below the label top. The course icon renders in white in place of the gray square.                                                |
| Skill name       | Roboto Black 11 pt white at x 297.6, uppercase.                                                                                                                     |
| Statement        | Regular 10 pt navy at x 269.1, 28.3 below the label top, line height 14, at most 3 lines, right edge x 549.5.                                                       |
| Level dots       | Five 11.2 pt circles at x 269.3, 304.8, 340.4, 375.9, 411.5 (pitch 35.55), 85.1 below the label top. Filled green, empty `#f0f0f0`.                                 |
| Level word       | "level:" Regular 9 pt `#3c4045` at x 501.5, then the level word in Black 9 pt green (D2 names, lower case), aligned with the dots.                                  |
| Footer           | Erasmus+ emblem image x 397.5 to 547.6, y 767.9 to 802.0 (template PNG, 519 by 118 px).                                                                             |

## Localized labels

Every label above is an i18n key in `messages/{en,es,it}.json` under one certificate PDF namespace, rendered in the certificate language.

The English values match the template text exactly, including "Recognizes". The signatory label reads "Represented by", a grammar fix from the native translation review (40cb81e6).

## Asset extraction

- Use PyMuPDF in a scratch virtualenv: export the page as SVG, then keep the logo paths (left header) and the arrows paths (right background).
- Convert the kept paths into react-pdf `Svg` and `Path` elements, or store them as path data the document maps over.
- Extract the Erasmus+ emblem with `extract_image` (xref 31 in the template) and store it next to the other PDF assets.
- Keep extracted assets under one folder owned by Lane A, and never ship the template PDF itself.

## Fidelity check (G5)

1. Generate a PDF from the template's lorem data: Oliver Matthews, BRITISH, 01.01.2022, MANCHESTER, Associazione JOINT, 3 tasks, 4 skills at 4 dots ("good").
2. Render the template and the generated file at 150 dpi with PyMuPDF.
3. Overlay them: every text baseline and shape must land within 1 pt, and outside the QR area only antialiasing may differ.
4. Repeat with es and it labels and with a 3-skill certificate, checking that nothing overflows.
