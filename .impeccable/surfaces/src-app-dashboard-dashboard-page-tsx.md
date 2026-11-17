---
version: 1
slug: 'src-app-dashboard-dashboard-page-tsx'
primary_target: 'src/app/(dashboard)/dashboard/page.tsx'
related_targets: ['src/app/(dashboard)/certificates/new/page.tsx']
---

# Volunteer dashboard

Surface brief for `/dashboard` as a volunteer sees it. Mode: Operate.

## Scope

- This brief covers the volunteer dashboard from the #84 direction gate.
- Tutor, manager, and admin dashboards keep their layout and take the new tokens only.
- The journey rail also guides the request wizard (`/certificates/new`), so its sub-steps are the wizard steps.

## Brief

- Audience: volunteers on a laptop or a phone, in `en`, `es`, or `it`.
- Job: see where they are on the path to a certificate, then take the next action in one click.
- Primary action: the next action of the current stage, for example "Continue draft".
- Content: skill course progress, the open request and its wizard step, tutor feedback, the certificate code after submit, and courses in progress.
- Constraints: the UI stays instant on a throttled phone. Each loading state copies the content shape or uses a spinner. Copy cites only product truth.

## States

- Learn: the volunteer is not eligible yet. The stage shows completed skill courses out of 3 and the rating rule. The action opens the next course.
- Request: a draft exists. The rail opens the wizard steps Experience, Skills, Your organization, and Review. The action resumes the draft on its first incomplete step.
- Review: the request is `submitted` or `in_review`. The stage names the tutor when one is assigned and shows the code. It has no primary action.
- Changes requested: the Request stage opens again with the tutor's comments. The action is "Resubmit".
- Certificate: the request is `approved`. The code links to `/verify/<code>`. The actions are download and share.
- Ended: a `rejected` or `withdrawn` request shows its outcome on the stage where it ended.

## Unresolved

- The wizard step "Review" and the journey stage "Review" share a name. Default: the rail labels the wizard step "Check and send".
- Below 1024 px the rail becomes a step bar above the stage, with the sub-steps in a disclosure. Confirm this at the build.

## Direction contract

THESIS: The certificate journey is the dashboard. A vertical rail keeps the four stages in view and opens the current stage into its real steps. It refuses the welcome banner over a grid of stat cards.

OWN-WORLD: Linear and GitHub craft level, built from GloRe material. White work surface, a cool gray sidebar and rail, hairline borders, and one soft shadow on the stage panel. Geist for the UI, Bricolage Grotesque for titles, Geist Mono for codes. Blue #1b84ad marks actions only. Navy #16304f marks titles and the current stage. Olive #5f7d12 on #eef4dc marks earned skills as double-ring seals.

STORY: The volunteer sees the four stages and their position. They read what the stage needs and what is done. They take the one next action.

FIRST VIEWPORT: At 1440 px: the app sidebar (232 px), the journey rail (280 px), then the stage. The rail holds the title, "Step 2 of 4", the four stages with the current one open, and "Also on your path". The stage holds a 44 px Bricolage title, a one-line lead, and a panel with the skill seals, "Continue draft" as the primary button, and "Preview certificate".

FORM: Journey rail, structure 1 of 7 on the ordered list, seed:70bb2e2c5c45ecf3. Signature interaction: when a step completes, its check lands and the rail line fills olive to the next step, with an ease-out of about 240 ms and no motion under reduced motion. Translations from the sketch: the current stage is navy, not blue. The code is `XXXX-XXXX-XXXX` with no prefix, and it appears at submit.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
