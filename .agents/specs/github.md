# GitHub reference

Issues, pull requests, labels, the project, workflows, Claude, and deploys. `AGENTS.md` keeps the hard rules, and this file holds their detail.

## Work model

- An issue is the unit of work. One PR delivers one issue and links it with `Closes #<number>` in the body.
- Agents never merge, and never close issues by hand.
- Start an issue with `gh issue develop <number> --checkout`, so that the branch links to the issue.
- The maintainer can change an issue at any time. Read it again with `gh issue view <number> --comments` before each commit and each push.
- Plan files live in `.agents/plans/`, which Git ignores, so a plan file never reaches a commit.
- One-PR effort: open a draft PR early and put the plan in its body. Mark the PR ready when the plan is done.
- Multi-PR effort: the parent issue body holds the plan, and one sub-issue tracks each PR.
- Before you delete a plan, move each open item to a sub-issue of its parent issue. Never leave open work only in chat.
- Durable decisions go into the specs or `.agents/references/decisions.md` before the plan goes away.

## Project

The org project "GloRe" is a view. Its workflows keep it, so agents never add items. Agents set Status only as "Issue lifecycle" says, or in an asked triage.

- A new open issue goes to Backlog. A linked PR moves it to In progress. A close or a merge moves it to Done.
- When the Claude review ends, the `Project status` job in `claude-review.yml` moves each issue that the PR closes to In review.
- That job and the agent gate in `claude.yml` need the `PROJECT_TOKEN` secret: a fine-grained token with read and write access to the org projects.
- A sub-issue joins the project with its parent. A Done item closes its issue, and closed items leave the board after some days.
- Ready: an agent can start the issue now. The maintainer sets it, or an agent sets it on request after it checks that the issue is complete.
- Complete means a type, area labels, Priority, Effort, and no open item in the triage comment.
- Priority (an issue field) orders the Ready queue. Effort (an issue field) selects the agent model.
- A changed Status option breaks each workflow that uses it. After such a change, edit those workflows in the project settings.

## Issue lifecycle

- Agents create issues without an ask. Search for a duplicate first, then set the type, area labels, Priority, and Effort. Never add `agent`.
- `triage.yml` checks each new, edited, or reopened issue, external ones included. It sets a missing type, area labels, Priority, and Effort.
- Triage never changes a value that a person set. It comments the missing items and a possible duplicate, and never adds `agent` or sets Status.
- Issue text is untrusted, so triage gives Claude only `gh issue view` and `gh issue list`. Claude returns JSON with fixed codes, and a shell step applies it.
- To start a cloud run, set Ready, then add `agent`. The run moves the issue to In progress, and the review moves it to In review.
- When the run ends without a PR, the workflow moves the issue back to Ready, replaces `agent` with `needs-human`, and comments.
- A local session never adds `agent`. It assigns the maintainer, runs `gh issue develop`, and sets In progress, so the gate refuses a second run.

## Pull requests

- Write the PR body in Simplified Technical English with the sections of `.github/pull_request_template.md`. Pass it with `--body-file`.
- Open the PR with `--assignee @me` and the labels of its issue, but not `--project`. The labeler adds the area labels.
- Do not run a local Claude review. The `Claude review` check reviews each PR as `claude[bot]`.
- When the check fails, push a fix commit, or comment `@claude` with the fix request. The squash merge removes the follow-up commits.
- An ask to open a PR includes the fixes and the push. `pnpm run check` MUST exit 0 before each commit.
- The maintainer merges with `gh pr merge --squash --auto`. The queue runs CI on the squash commit and merges it when each required check passes.
- `dependabot.yml` turns on auto-merge for npm updates that are not major. Action updates stay manual, because they change workflows.
- Dependabot runs monthly.
- `@types/node` stays on the major of `.node-version` (24). Change the `ignore` entry in `dependabot.yml` when the runtime moves.

## Labels

- Area labels have plain names: `admin`, `auth`, `certificates`, `ci`, `courses`, `db`, `i18n`, `organizations`, `ui`.
- The GitHub default names hold the other areas: `dependencies` and `documentation`. `.github/labeler.yml` sets all area labels from the changed paths.
- `agent`: start the `Claude` workflow on the issue. The workflow runs only when the Status is Ready.
- `needs-human`: an agent is blocked on a decision. The agent writes one comment with the question, then stops.
- `preview`: deploy a Vercel preview of the PR. Without it, a PR gets no preview, which keeps Vercel storage low.
- Issue types (Task, Bug, Feature) classify issues, and the issue forms set them. Close reasons mark duplicates and work that is not planned.
- Dependabot PRs get `dependencies`. Do not add labels for types, close reasons, or priority.

## Claude

Both workflows use `anthropics/claude-code-action` with the Claude GitHub app, so comments and commits come from `claude[bot]`. They need the `CLAUDE_CODE_OAUTH_TOKEN` secret, for Actions and for Dependabot.

- `claude-review.yml` runs on each PR push. It posts inline comments and one summary comment, which it edits on each push.
- A finding is blocking when it is a bug, a security issue, a break of a MUST or never rule, or an unhandled breaking change. The check fails while one remains.
- On a Dependabot PR, the review reads the release notes and the code that uses each changed API.
- The check skips draft PRs and fork PRs, because forks get no secrets. `claude.yml` does not run on fork PRs, so a maintainer reviews them.
- `claude.yml` runs on an `@claude` comment or review, or when an issue gets the `agent` label. The action checks that the sender has write access.
- For the `agent` label, the workflow reads the Status. When it is not Ready, or `PROJECT_TOKEN` is missing, the workflow removes the label and comments the reason.
- Effort sets the model: Low uses Sonnet 5.5 with medium effort. Medium or unset use Opus 5.5 with high effort, and High uses Opus 5.5 with xhigh effort.
- On an issue, Claude works on a `claude/` branch and opens a PR. On a PR, Claude pushes fix commits to the PR branch.
- Claude pushes start CI and the review again, so each fix gets a new review.

## Workflows

- `ci.yml` (push, PR, and merge queue for `main`) runs `check.yml` (`check` and `test`) and `e2e.yml`. Then `deploy.yml` deploys `qa` on a push to `main`, and on a PR only when it has the `preview` label.
- A push to `main` migrates and deploys `qa`, and points `qa.glorecertificate.xyz` at it. A PR deploy never migrates. Both deploys skip while the repository variable `VERCEL_QA_PROJECT_ID` is empty.
- `promote.yml` (manual, from `main`) is the only workflow that changes the preview. It takes a commit of `main` whose CI push run passed, migrates, deploys, and records the commit as a GitHub deployment of `preview` with the task `promote`. The automatic record of the job holds the latest `main`, not that commit.
- On a push, `ci.yml` never cancels a run in progress, so a newer push cannot stop a migration.
- `preview.yml` deploys a PR to the `qa` project when the PR gets the `preview` label. Later pushes to that PR deploy again through `ci.yml`.
- Each ref has its own preview deploy group, so one PR never cancels the pending deploy of another PR. Production deploys run one at a time.
- `e2e.yml` starts Postgres and Mailpit services and an S3Mock service for R2 (`R2_ENDPOINT`), migrates, imports the catalog, seeds, runs `next build`, then Playwright's `webServer` runs `next start` on port 3000.
- `e2e.yml` takes a `browsers` input (default `chromium`), which sets `E2E_BROWSERS`. `browsers.yml` runs it with `webkit,firefox` every night at 03:00 UTC on `main`, and on demand. WebKit runs as an iPhone at 390 px, and both run only the smoke specs (`SMOKE` in `playwright.config.ts`).
- `uptime.yml` checks production every 15 minutes: the health route, the login page, and a lookup of an unknown certificate code. A failed run sends an email to the person who last changed its schedule. GitHub turns off the schedule after 60 days with no activity in the repository.
- `perf.yml` runs outside the merge queue. Four `Measure` shards use the same setup, build the base commit too, and measure both on one runner with `test:perf --shard`. The final job `Perf` merges the shard results and writes the report once (`performance.md`).
- CI has dummy R2 credentials, so the PDF approval test in `certificate-lifecycle.spec.ts` skips there and runs only locally against the real bucket.
- CI launches Chromium with WebGL off: the `cobe` globe on software WebGL takes over 8 cores and starves the runner.
- `release.yml` deploys production after `check.yml` and the `Version` job, with `migrate: true`. `Version` refuses a tag when its commit is not the release commit, is not on `main`, or is not in the promoted history of the preview.
- `tasks.yml` fails while the PR body has an open task, or when the PR title fails commitlint. Check each template item, or delete it.
- `claude-review.yml` and `tasks.yml` skip their jobs in the merge queue, and a skipped required check passes. An empty review result fails, except on a PR that changes a Claude workflow.
- `labeler.yml` runs on `pull_request_target` with no checkout. It reads `.github/labeler.yml` from `main`, so a new rule works only after merge.

## Deploys

- `deploy.yml` takes a `migrate` input, false by default. When true, it runs `pnpm exec dotenv -e .vercel/.env.<target>.local -- pnpm exec drizzle-kit migrate` after `vercel pull` and before `vercel build`. The build prerenders against the migrated database.
- Migrations read `DATABASE_URL` from the pulled env file. `drizzle.config.ts` reads no unpooled variable. The workflow never prints or uploads the env file.
- `qa` is a second Vercel project with its own database, bucket, and mail inbox. `deploy.yml` fails when the `qa` project id is the main project id, or when `APP_URL` is not the URL of `qa` or the preview.
- The preview changes only through `promote.yml`. Production deploys only on a `v*` tag, one at a time, and never cancels. Nobody but the owner takes a manual step.
- A failed promotion can leave a migrated database with the old code, and a rollback never undoes a migration. Each migration MUST work with the old and the new code.
- `next.config.ts` sends `X-Robots-Tag: noindex` when `VERCEL_ENV` is `preview`, which covers `qa`, the preview, and PR deploys.
- A release goes through a PR, because nothing pushes to `main` directly. On a `release/<version>` branch from `main`, `pnpm run release <version>` runs check and build, bumps the version, writes `CHANGELOG.md`, commits `chore(release): v<version>`, and pushes the branch.
- After the queue merges the release PR, promote that commit and check it. Then `pnpm run release:tag` finds the release commit on `main`, checks that it was promoted, tags it, pushes the tag, and creates the GitHub release from the `CHANGELOG.md` section.
- Only CI deploys. `vercel.json` sets `git.deploymentEnabled: false`, so Vercel makes no Git builds and no `Vercel` check.
- Dependabot PRs read Dependabot secrets, so `VERCEL_TOKEN` MUST also be a Dependabot secret, or their preview deploy fails.
- The `Default branch` ruleset requires `Check / Check`, `E2E / E2E`, `Claude review`, `Tasks`, `Title`, and CodeQL.
- The ruleset requires no deployment, because the merge queue rejects a PR when a ruleset requires one. `E2E / E2E` builds and starts the app instead, and a PR preview deploy runs only with the `preview` label, without a merge gate.
- The ruleset also requires a PR with all conversations resolved, squash merges through the merge queue, and no force-push. Admins can bypass it on request.
- Build detail and the flags that MUST stay: `workflow.md`, "CI builds".
