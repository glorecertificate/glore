# GitHub reference

Issues, pull requests, labels, the project, workflows, Claude, and deploys. `AGENTS.md` keeps the hard rules, and this file holds their detail.

## Work model

- An issue is the unit of work. One PR delivers one issue and links it with `Closes #<number>` in the body.
- Agents never merge, and never close issues by hand.
- Start an issue with `gh issue develop <number> --checkout`, so that the branch links to the issue.
- The maintainer can change an issue at any time. Read it again with `gh issue view <number> --comments` before each commit and each push.
- One-PR effort: open a draft PR early with the plan file as its first commit. Delete the plan in the last commit, then mark the PR ready.
- Multi-PR effort: the parent issue body holds the plan, and one sub-issue tracks each PR. No plan file stays on `main`.
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
- When the check fails, fold each fix into the commit that it changes and push with lease. Or comment `@claude` with the fix request.
- An ask to open a PR includes the fixes and the push. `pnpm run check` MUST exit 0 before each commit.
- Claude pushes `fixup!` commits. Run `git pull --ff-only`, then `git rebase -i --autosquash main` and `git push --force-with-lease` before the merge.

## Labels

- Area labels have plain names: `admin`, `auth`, `certificates`, `ci`, `courses`, `db`, `i18n`, `organizations`, `ui`.
- The GitHub default names hold the other areas: `dependencies` and `documentation`. `.github/labeler.yml` sets all area labels from the changed paths.
- `agent`: start the `Claude` workflow on the issue. The workflow runs only when the Status is Ready.
- `needs-human`: an agent is blocked on a decision. The agent writes one comment with the question, then stops.
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
- On an issue, Claude works on a `claude/` branch and opens a PR. On a PR, Claude pushes `fixup!` commits to the PR branch, because it cannot force-push.
- Claude pushes start CI and the review again, so each fix gets a new review.

## Workflows

- `ci.yml` (push and PR to `main`) runs `check.yml` (`check` and `test`) and `e2e.yml`, then the preview `deploy.yml` after both pass.
- `e2e.yml` starts Postgres and Mailpit services, migrates, imports the catalog, seeds, runs `next build`, then Playwright's `webServer` runs `next start` on port 3000.
- CI has dummy R2 credentials, so the PDF approval test in `certificate-lifecycle.spec.ts` skips there and runs only locally against the real bucket.
- CI launches Chromium with WebGL off: the `cobe` globe on software WebGL takes over 8 cores and starves the runner.
- `release.yml` deploys production after `check.yml` only.
- `tasks.yml` fails while the PR body has an open task. Check each template item, or delete it when it does not apply.
- `labeler.yml` runs on `pull_request_target` with no checkout. It reads `.github/labeler.yml` from `main`, so a new rule works only after merge.

## Deploys

- Only CI deploys. `vercel.json` sets `git.deploymentEnabled: false`, so Vercel makes no Git builds and no `Vercel` check.
- The `Default branch` ruleset requires `Check / Check`, `E2E / E2E`, `Claude review`, `Tasks`, CodeQL, and the `preview` deployment.
- The ruleset also requires a PR with all conversations resolved, and the rebase merge method. Admins can bypass it.
- Build detail and the flags that MUST stay: `workflow.md`, "CI builds".
