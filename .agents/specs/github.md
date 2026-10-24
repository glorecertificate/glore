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

The org project "GloRe" is a view. Its workflows keep it, so agents never add items or set Status, except in a triage that the maintainer asks for.

- A new open issue goes to Backlog. A linked PR moves it to In progress. A close or a merge moves it to Done.
- When the Claude review ends, the `Project status` job in `claude-review.yml` moves each issue that the PR closes to In review.
- That job needs the `PROJECT_TOKEN` secret: a fine-grained token with read and write access to the org projects.
- A sub-issue joins the project with its parent. A Done item closes its issue, and closed items leave the board after some days.
- Ready: an agent can start the issue now. The maintainer sets it, or an agent sets it when the maintainer asks for a triage.
- A changed Status option breaks each workflow that uses it. After such a change, edit those workflows in the project settings.

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
- `agent`: the issue is ready for Claude. The `Claude` workflow starts work on it.
- `needs-human`: an agent is blocked on a decision. The agent writes one comment with the question, then stops.
- `maintenance` and the GitHub defaults (`bug`, `enhancement`, `question`) classify issues.

## Claude

Both workflows use `anthropics/claude-code-action` with the Claude GitHub app, so comments and commits come from `claude[bot]`. They need the `CLAUDE_CODE_OAUTH_TOKEN` secret, for Actions and for Dependabot.

- `claude-review.yml` runs on each PR push. It posts inline comments and one summary comment, which it edits on each push.
- A finding is blocking when it is a bug, a security issue, a break of a MUST or never rule, or an unhandled breaking change. The check fails while one remains.
- On a Dependabot PR, the review reads the release notes and the code that uses each changed API.
- The check skips draft PRs and fork PRs, because forks get no secrets. `claude.yml` does not run on fork PRs, so a maintainer reviews them.
- `claude.yml` runs on an `@claude` comment or review, or when an issue gets the `agent` label. The action checks that the sender has write access.
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
