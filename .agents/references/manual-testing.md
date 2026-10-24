# Manual testing flows

Step-by-step flows per user type for manual testing of v0.7.

They describe the target behavior in the specs in `.agents/specs/`.

## Setup

1. Local: run `pnpm run db:up`, `pnpm run mail:up`, `pnpm run content:import --target local`, `pnpm run db:seed:demo --target local`, and `pnpm run dev`.
   - The seed needs `TEST_EMAIL` in `.env.local` and the course catalog in the database, so import content first.
   - Importing after seeding can delete progress rows when a lesson changed.
2. Open `https://glore.localhost`; local email lands in Mailpit at `http://localhost:8025`.
3. Re-run `pnpm run db:seed:demo --target local` at any time to reset everything it owns to the state below.
   - It owns the demo accounts, both approved organizations and the applicant, their invitations, links, requests, certificates, events, notifications, and the learning progress of demo accounts.
   - Accounts created by creation flows (`new-*`) stay, and their memberships in the demo organizations are removed.
4. Staging: open `https://preview.glorecertificate.xyz`, the preview CI deploys from `main`; email reaches the real `TEST_EMAIL` inbox.
5. Staging uses the Vercel Preview env vars: `DATABASE_URL` (Neon `staging`) and `APP_URL` (`https://preview.glorecertificate.xyz`).
6. Seed staging with its `DATABASE_URL` and `TEST_EMAIL` in front of `pnpm run content:import --target staging` and then `pnpm run db:seed:demo --target staging`.
   - The demo script refuses any database whose comment is not `glore:staging`. Both are user-approved steps.
7. Dates in the seed are relative to the run (for example "9 days ago"), so re-seed before a test day if you need ages, invitation expiry, or unread notifications to match this page.

## Accounts

Every account uses the password `Password1!`. Emails are plus-addresses of `TEST_EMAIL` from `.env.local`.

With `TEST_EMAIL=name@example.org`, the key `volunteer` logs in as `name+glore-volunteer@example.org` and has the username `demo.volunteer` (dots replace hyphens: `demo.volunteer.progress`).

| Key                  | Role                             | Organization                          | Seeded state                                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`              | Platform admin (en)              | none                                  | Sees one pending application (Open Doors Collective) with one unread notification; `team.invited`, application decisions, two revocations, and one suspension with reinstatement in `/admin/audit`.                                                                                                                           |
| `editor`             | Editor (en)                      | none                                  | Owns two draft courses with missing translations: `demo-active-listening-in-teams` (English title only) and `demo-giving-and-receiving-feedback` (no Italian).                                                                                                                                                                |
| `owner`              | Org owner (en)                   | Ponte Volunteers (Demo), Milan, Italy | Profile, legal name, registry ID, and legal representative complete; no signature or logo. Two pending invitations, one active invite link with approval (1 of 20 uses), one pending join request, two unread notifications.                                                                                                  |
| `rep`                | Representative (it)              | Ponte Volunteers (Demo)               | Default member; sees the same unread join request and escalation.                                                                                                                                                                                                                                                             |
| `tutor`              | Tutor (en)                       | Ponte Volunteers (Demo)               | `volunteer-review` `submitted`, `member-01` `in_review` (9 days old, flagged), `volunteer-changes` in `changes_requested`; past decisions: `volunteer` approved, `member-04` rejected; one withdrawn request. Two unread notifications.                                                                                       |
| `tutor2`             | Tutor (it)                       | Ponte Volunteers (Demo)               | `member-02` `submitted`, assigned to `tutor2`, for reassignment; five approved and one revoked certificate in history; two unread notifications.                                                                                                                                                                              |
| `volunteer`          | Volunteer (en)                   | Ponte Volunteers (Demo)               | Eligible (four skill courses done), one approved certificate (food bank, featured, no stored PDF), one draft with three skills, public profile on, skill compass set.                                                                                                                                                         |
| `volunteer-progress` | Volunteer (it)                   | Ponte Volunteers (Demo)               | `team-work` and `self-awareness` done, `problem-solving` half done (2 of 4 lessons, one question solved, one wrong attempt). No birth place or nationality, so the wizard asks for them once the third course is done (the wizard opens only after three skill courses). Private profile, skill compass set. No certificates. |
| `volunteer-review`   | Volunteer (it)                   | Ponte Volunteers (Demo)               | Request `submitted` 2 days ago, assigned to `tutor`.                                                                                                                                                                                                                                                                          |
| `volunteer-changes`  | Volunteer (it)                   | Ponte Volunteers (Demo)               | Request in `changes_requested` with a comment and section comments on tasks and experience; one unread notification.                                                                                                                                                                                                          |
| `learner`            | Learner (en)                     | Ponte Volunteers (Demo)               | `welcome-to-glore` and `intercultural-learning` completed, `volunteer-wellbeing-and-safety` 1 of 3 lessons done. No certificates.                                                                                                                                                                                             |
| `multi`              | Volunteer in Ponte, tutor in Red | Both demo organizations               | Active org Ponte (first membership). In Red they review `red-03`'s `submitted` request and have an approved and a revoked certificate in history.                                                                                                                                                                             |
| `owner-b`            | Org owner, Spanish locale        | Red Solidaria (Demo), Valencia, Spain | One approved certificate (`red-01`), one revoked certificate (`red-02`), one `submitted` request (`red-03`), one pending invitation, three organization ratings.                                                                                                                                                              |
| `applicant`          | Applicant (no account yet)       | Open Doors Collective (Demo), pending | Application waiting for platform admin review: legal data, volunteers per year, motivation, and charter acceptance filled. Its email is the registrant address.                                                                                                                                                               |

Background accounts give the organization a history. They log in like any other account but no flow needs them, and most are safe to remove or change:

| Keys                         | Organization | State                                                                                                                                         |
| ---------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `member-01`                  | Ponte        | Request `in_review` with `tutor`, 9 days old, with a day 3 and day 7 reminder and an escalation to managers. Use it to reject a test request. |
| `member-02`                  | Ponte        | Request `submitted`, assigned to `tutor2`.                                                                                                    |
| `member-03`                  | Ponte        | Approved by `tutor2` after one round of changes. Use it to revoke a test certificate.                                                         |
| `member-04`                  | Ponte        | Request `rejected` by `tutor` with a reason.                                                                                                  |
| `member-05`                  | Ponte        | Request `withdrawn`.                                                                                                                          |
| `member-06`, `07`, `08`      | Ponte        | Approved by `tutor2`, 70, 100, and 135 days ago (four skills for `member-06`).                                                                |
| `member-09`                  | Ponte        | Request `submitted` and unassigned (the tutor stepped away). Use it for "Self-assign" in the "Unassigned" tab.                                |
| `member-10`                  | Ponte        | Certificate `revoked` by `owner`.                                                                                                             |
| `member-11`                  | Ponte        | Learner with one learner course completed.                                                                                                    |
| `member-12`                  | Ponte        | Volunteer who joined through a request; suspended and reinstated in the audit log.                                                            |
| `red-01`, `red-02`, `red-03` | Red          | Approved, revoked, and `submitted` certificates.                                                                                              |
| none (no account)            | Ponte        | One approved certificate whose holder deleted their account (public verification still shows it valid).                                       |

Addresses without accounts, used by pending items:

- `invited-volunteer` and `invited-tutor`: pending invitations in Ponte, sent 2 and 4 days ago, so "Resend" works.
- `red-invited`: pending invitation in Red.
- `join-request`: pending request through the invite link.
- `rejected-request`: a past rejected request.
- Open a pending invitation with its "Copy link" action, which issues a fresh proof.

Unseeded keys for creation flows: `new-volunteer`, `new-learner`, `new-tutor`, `new-org`.

Ponte also shows ratings (14 certificates rated) for the insights aggregate, activity events in every feed category, and read and unread notifications.

Red has three ratings, which is the minimum for its aggregate to show.

### Certificate codes

Codes are derived from the certificate handle, so they are the same on every database.

| Key            | Status                   | Code             |
| -------------- | ------------------------ | ---------------- |
| `volunteer`    | approved                 | `B1JA-7MDX-CS44` |
| `member-03`    | approved                 | `KJRY-HGDA-BPRZ` |
| `member-06`    | approved                 | `YE5A-4W4N-MSN8` |
| `member-07`    | approved                 | `5HTR-H07V-DRPY` |
| `member-08`    | approved                 | `T65E-2TFE-060V` |
| `member-10`    | revoked (Ponte)          | `MDTD-PBWR-PCSW` |
| `red-01`       | approved (Red)           | `5REG-P4QQ-1G6N` |
| `red-02`       | revoked (Red)            | `B8YR-MG6F-WY26` |
| deleted holder | approved, holder deleted | `ANGN-EWXR-GZB9` |

Other requests also carry codes from submission; `pnpm run db:seed:demo` prints all of them.

Approved certificates are seeded with a snapshot but no stored PDF: the download link renders the PDF on demand from the snapshot.

To exercise the stored PDF and the R2 upload, approve the resubmitted request of `volunteer-changes` as `tutor` (Tutor flow, step 4).

## Public and authentication

1. Open `/` while signed out: you land on `/login`.
2. Log in as `volunteer` with the email, log out, then log in with the username shown in Settings.
3. Use "Forgot password" for `learner`, open the email, set a new password, and log in with it.
4. Open `/verify`, paste the `volunteer` code (`B1JA-7MDX-CS44`, printed on its PDF): the page shows "Valid", the holder, the organization, skills, and levels.
5. Verify the revoked Red code (`B8YR-MG6F-WY26`): the page shows "Revoked on" with the date and no reason.
   - Then verify `ANGN-EWXR-GZB9`: the page shows it valid with the holder's name and a note that the holder no longer has an account.
   - As the Ponte owner, `/organization?tab=certificates` lists it as "No longer on GloRe" with View and Revoke.
6. Open `/demo.volunteer` (public) and `/demo.volunteer.progress` (private): the first shows the featured certificate, the second shows the not-found page.
7. Open `/privacy` and `/terms` signed out.

## Organization application

1. Signed out, open `/register` and apply as `new-org` with every step filled and the Quality Charter accepted.
2. Expect the receipt email for `new-org` and a notification for `admin`.
3. As `admin`, approve it in `/admin/organizations`: `new-org` receives an invitation email.
4. Accept it, complete onboarding, and confirm the dashboard shows the owner checklist.

## Platform admin (`admin`)

1. `/admin` shows organizations, members, certificates by month, and average review time with real numbers.
2. In `/admin/organizations`, open the `applicant` application and read its details and charter acceptance.
3. Reject it with a comment: `applicant` receives the decision email, and the organization moves to the Rejected tab.
4. In `/admin/users`, ban `learner` for 1 day with a reason, confirm `learner` cannot log in, then unban.
5. Impersonate `volunteer` with a reason: a banner shows; stop impersonating and find both events in `/admin/audit`.
6. In `/admin/team`, invite `new-tutor` as editor, resend the invitation, then change the role to admin and back.
7. In `/admin/certificates`, search a code, open it, and revoke the `member-03` certificate with a reason.
8. Confirm the sidebar has no Organization item.

## Editor (`editor`)

1. Create a skill course, add four lessons, a quiz with explanations, evaluations, and a final assessment.
2. Fill duration and outcomes, translate to es and it (AI assistant allowed), and publish each language.
3. Open `/courses/skills`, edit a skill group description, and reorder the groups.
4. Preview the course as a learner, then open its analytics sheet.
5. Confirm there is no Organization or Certificates item in the sidebar.

## Org owner (`owner`)

1. Dashboard shows the pipeline, members by role, pending invitations, and recent activity.
2. Members: invite `new-volunteer` as volunteer, then paste three addresses in bulk and read the per-row results.
3. Invitations: resend one, revoke another, and confirm the revoked link shows an error page.
4. Create an invite link for learners with approval, open it as `new-learner`, then approve the request in Requests.
5. Change `rep`'s role to tutor and back; remove a test member; read the emails each person received.
6. The Members table, the org switcher, and the command palette label `owner` as Owner.
   - Switch to `es` and `it`: Administrador/a and Amministratore.
   - In `/admin/team` and `/admin/users`, the platform role stays Admin in all three languages.

## Org owner settings and certificates (`owner`)

1. Settings: set the legal representative and upload a signature and logo; regenerate a certificate PDF and check them.
2. Certificates tab: reassign the `member-02` request from `tutor2` to `tutor`, then revoke the `member-06` certificate.
3. Insights: progress, certificates per month, review time, tutor workload, and the rating aggregate.
4. Transfer ownership to `rep`, confirm both emails, then transfer it back from `rep`'s account.

## Representative (`rep`)

1. Invite a volunteer, approve a join request, and remove a volunteer.
2. Reassign a request between `tutor` and `tutor2`.
3. Confirm role changes, settings, ownership transfer, and deletion are not offered.

## Tutor (`tutor`)

1. Dashboard and `/certificates` show the queue with ages; the request older than 7 days is flagged.
2. Open the `volunteer-review` request and click "Start review": it moves to "In review" and the volunteer gets a notification.
3. Lower one skill level, edit a statement, fill the blind evaluation, and request changes with a comment on tasks.
4. As `volunteer-changes` (another browser), resubmit; back as `tutor`, approve after previewing the PDF.
5. Reject the `member-01` request with a reason and check the volunteer's email.
6. Self-assign the `member-09` request from the "Unassigned" tab.

## Volunteer joining by invitation (`new-volunteer`)

1. Open the invitation email from the owner flow and accept it.
2. Complete onboarding: names, birthday, nationality, birth place, language, password; note the username shown at the end.
3. Set the skill compass (strengths and goals) and open a recommended course.
4. Confirm the welcome email arrived.

## Volunteer certificate journey (`volunteer-progress`, `volunteer`)

1. As `volunteer-progress`, finish the third skill course: answer a quiz wrongly, read the explanation, retry, and pass.
2. Write the reflection in the final assessment, rate the course, and see "Request your certificate" on the completion screen.
3. Start the wizard, fill experience and tasks, pick 3 skills, rate the organization, and save a draft.
4. Resume the draft from `/certificates`, complete personal details, submit, then withdraw and submit again.
5. As `volunteer`, open the approved certificate: download the PDF and compare it with the template.
6. Use the share panel: copy the link, open "Add to LinkedIn", and scan the QR code with a phone.
7. In Settings, Privacy, set the featured certificate, then open the public profile.

## Learner (`learner`)

1. The catalog shows intro and learner courses only; skill courses never appear.
2. Resume the in-progress course from the dashboard, finish it, and rate it.
3. Confirm the sidebar has no Certificates item and `/certificates` shows a 404.

## Multi-organization member (`multi`)

1. Switch from Ponte to Red Solidaria in the org switcher: the dashboard changes to the tutor view.
2. Leave Red Solidaria from the org switcher and confirm the owner sees a notification.

## Checks for every account

1. Switch the language to es and it: no English strings remain on the visited pages.
2. Toggle dark mode and a 390px viewport on every visited page.
3. Open the command palette and reach a course, a setting, and a role-specific page.
4. Open the notification center, mark all read, and follow a notification link.
5. In Settings, export your data, list active sessions, and revoke one.
