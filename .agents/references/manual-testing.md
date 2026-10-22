# Manual testing flows

Step-by-step flows per user type for manual testing of v1.

They describe the target behavior in `.agents/plans/v1-release/`, so a step passes only once its task has landed.

## Setup

1. Local: run `pnpm run db:up`, `pnpm run mail:up`, `pnpm run db:seed:demo --target local`, `pnpm run content:import`, and `pnpm run dev`.
2. Open `https://glore.localhost`; local email lands in Mailpit at `http://localhost:8025`.
3. Staging: open the Vercel preview of the `staging` branch; email reaches the real `TEST_EMAIL` inbox.
4. Staging needs preview env vars scoped to git branch `staging`: `DATABASE_URL` (Neon `staging`) and `APP_URL` (the preview URL).
5. Seed staging with its `DATABASE_URL` in front of `pnpm run db:seed:demo --target staging`; the script refuses any database whose comment is not `glore:staging`.

## Accounts

Every account uses the password `Password1!`. Emails are plus-addresses of `TEST_EMAIL` from `.env.local`.

With `TEST_EMAIL=name@example.org`, the key `volunteer` logs in as `name+glore-volunteer@example.org`.

| Key                  | Role                             | Organization                          | Seeded state                                                                                 |
| -------------------- | -------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `admin`              | Platform admin                   | none                                  | Sees one pending application.                                                                |
| `editor`             | Editor                           | none                                  | Owns two draft courses with missing translations.                                            |
| `owner`              | Org owner                        | Ponte Volunteers (Demo), Milan, Italy | Profile and signatory complete, two pending invitations, one invite link, one join request.  |
| `rep`                | Representative                   | Ponte Volunteers (Demo)               | Default member.                                                                              |
| `tutor`              | Tutor                            | Ponte Volunteers (Demo)               | One request `submitted`, one `in_review`, two past decisions, one request older than 7 days. |
| `tutor2`             | Tutor                            | Ponte Volunteers (Demo)               | One assigned request, used for reassignment.                                                 |
| `volunteer`          | Volunteer                        | Ponte Volunteers (Demo)               | Eligible, one approved certificate, one draft, public profile on.                            |
| `volunteer-progress` | Volunteer                        | Ponte Volunteers (Demo)               | Two of three skill courses done, third course half done.                                     |
| `volunteer-review`   | Volunteer                        | Ponte Volunteers (Demo)               | Request `submitted`, assigned to `tutor`.                                                    |
| `volunteer-changes`  | Volunteer                        | Ponte Volunteers (Demo)               | Request in `changes_requested` with section comments.                                        |
| `learner`            | Learner                          | Ponte Volunteers (Demo)               | One learner course in progress, one completed.                                               |
| `multi`              | Volunteer in Ponte, tutor in Red | Both demo organizations               | Active org Ponte.                                                                            |
| `owner-b`            | Org owner, Spanish locale        | Red Solidaria (Demo), Valencia, Spain | One approved certificate, one revoked certificate.                                           |
| `applicant`          | Applicant (no account yet)       | Open Doors Collective (Demo), pending | Application waiting for platform admin review.                                               |

Unseeded keys for creation flows: `new-volunteer`, `new-learner`, `new-tutor`, `new-org`.

## Public and authentication

1. Open `/` while signed out: you land on `/login`.
2. Log in as `volunteer` with the email, log out, then log in with the username shown in Settings.
3. Use "Forgot password" for `learner`, open the email, set a new password, and log in with it.
4. Open `/verify`, paste the code printed on the `volunteer` PDF: the page shows "Valid", the holder, the organization, skills, and levels.
5. Verify a revoked code from `owner-b`'s organization: the page shows "Revoked on" with the date and no reason.
6. Open `/<username>` of `volunteer` (public) and of `volunteer-progress` (private): the first lists certificates, the second shows a 404.
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
7. In `/admin/certificates`, search a code, open it, and revoke a test certificate with a reason.
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

## Org owner settings and certificates (`owner`)

1. Settings: set the legal representative and upload a signature and logo; regenerate a certificate PDF and check them.
2. Certificates tab: reassign the `tutor2` request to `tutor`, then revoke a test certificate.
3. Insights: progress, certificates per month, review time, tutor workload, and the rating aggregate.
4. Transfer ownership to `rep`, confirm both emails, then transfer it back from `rep`'s account.

## Representative (`rep`)

1. Invite a volunteer, approve a join request, and remove a volunteer.
2. Reassign a request between `tutor` and `tutor2`.
3. Confirm role changes, settings, ownership transfer, and deletion are not offered.

## Tutor (`tutor`)

1. Dashboard and `/certificates` show the queue with ages; the request older than 7 days is flagged.
2. Open the `volunteer-review` request: it moves to "In review" and the volunteer gets a notification.
3. Lower one skill level, edit a statement, fill the blind evaluation, and request changes with a comment on tasks.
4. As `volunteer-changes` (another browser), resubmit; back as `tutor`, approve after previewing the PDF.
5. Reject a test request with a reason and check the volunteer's email.
6. Self-assign an unassigned request from the "Unassigned" tab.

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
