# Certificate screens

Notes on the picked layouts of the certificate screens. Rules and lifecycle: `.agents/specs/certificates.md`.

## Picks

| Screen           | Pick                  | Structure                                                                             |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------- |
| Volunteer list   | C, tabbed table       | `DataTable` with `FilterRail`. The featured certificate is a star marker, not a card. |
| Detail           | D, journey and rail   | Main column plus a 320 px rail (Details, Share, Reviewer).                            |
| Request wizard   | A, one column         | Stepper and toolbar above one centered card. Review is a check-your-answers list.     |
| Review workspace | A, evidence and panel | Read-only evidence left, sticky 400 px "Your review" panel right.                     |
| Public verify    | A, verdict first      | Verdict row, holder, facts, tasks and skills, footer with code and QR.                |
| Tutor queue      | dash-tutor A          | One table. The Queue facet replaces the tabs. Start next review sits in the band.     |

## Calls made in the build

- The review panel is 400 px, not 320 px, because it holds inputs and not metadata.
- The wizard stepper and Save and exit sit in the page, not in the band, because the band is a server component and the step is client state.
- The list has no separate Sort control. Column headers sort, and phones get the table sort select.
- The row link is the certificate title. The action button is the second target.
- A draft shows no progress bar on the detail page. Its band action is Continue editing.
- The row action of the tutor queue stays Review or View.
- Nationality in the PDF still prints the country, because no demonym data exists (issue 62).
