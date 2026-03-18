---
name: ship
description: Ships the next feature from the project roadmap by presenting backlog status, picking the next task, implementing it, and looping until the backlog is clear. Use when users want to implement features, manage the backlog, resume a task in progress, or run a codebase review. Triggers on `/ship`, "continue", "ship", "review", "next task", or "backlog".
compatibility: Designed for Claude Code and VS Code Copilot Chat. The session title step uses the run_vscode_command tool. On GitHub.com Copilot, it falls back to PR title updates instead.
argument-hint: start | continue | review | <slug>
---

You are the lead engineer on this project. Your job is to keep the roadmap moving: present the current status, pick the next task, implement it, and loop until the backlog is clear.

---

## Preliminary checks

Run these checks **every time** `/ship` is invoked, before doing anything else.

### 1. AGENTS.md

Check for `AGENTS.md` in the repository root. If the file is **missing** or **empty**, stop immediately and say:

> `AGENTS.md` is <missing/empty>. This file is the single source of truth for agent conventions. Create it before running `/ship`.

### 2. SPEC.md and ROADMAP.md location

`references/spec.md` and `references/roadmap.md` live **only** inside this skill's `references/` folder (`.agents/skills/ship/references/`). They do NOT exist at the repository root. Always resolve their path relative to this skill's directory, never relative to the project root.

---

## Step 1: Load context

Read all three files in parallel:

- `AGENTS.md`: coding conventions, architecture, enforced patterns
- `references/spec.md`: what the app does and what the business rules are
- `references/roadmap.md`: current feature status and decisions log

If `references/spec.md` exists but is empty or only contains template placeholder text, stop and say:

> `references/spec.md` is empty. Fill it in with your app description, then run `/ship` again.

---

## Step 2: Present the roadmap

**Every time `/ship` is invoked**, present the current roadmap state in a clear, readable format:

```
📦 Roadmap: [Project name]

🔄 Active
  [~] slug: Feature name   (agent: x7k2pa, started: YYYY-MM-DD HH:MM)
  [~] slug: Feature name   (stale, no active agent)

📋 Backlog
  [ ] slug: Feature name   (notes if any)
  [ ] slug: Feature name

✅ Done (N completed)
  [x] slug: Feature name   Completed: YYYY-MM-DD
  ...

```

If the backlog is empty and nothing is active, say:

> The backlog is empty. Add features to `references/roadmap.md → Backlog`, then run `/ship` again.

---

## Concurrent task handling

Multiple agents can work on this project simultaneously. Every time a `/ship` session starts, it must assess the current concurrency state before choosing what to work on.

### Session ID

Generate a random 6-character alphanumeric string (e.g. `x7k2pa`) at the start of each session. Use it consistently when stamping tasks in `references/roadmap.md` for the duration of that session.

### Staleness

A `[~]` task is **stale** when:

- It carries no `agent:` annotation, or
- It has an `agent:` annotation but that session has left no recent git activity tied to it. Check `git log --oneline -20` for commits referencing the slug; if none exist in a reasonable window (a few hours), treat the task as abandoned.

A `[~]` task is **claimed** when it has a valid `agent:` annotation with recent matching git activity.

### Task selection algorithm

Follow these steps in order whenever choosing what to work on:

**1. Stale active task?**
Scan all `[~]` tasks. If any are stale, pick the highest-priority one (top of the Active section), claim it by stamping your session ID and timestamp, check git history to understand what was already done, and resume from there.

**2. All active tasks are claimed (or no active tasks exist)?**
Scan the `[ ]` backlog in priority order (top to bottom). Pick the first task that does not conflict with any currently claimed task.

Two tasks **conflict** when they would modify the same files, modules, data tables, or domain areas. Assess this by:

- Inspecting recent commits on claimed tasks (`git log --name-only`) to see which files they touched
- Comparing those against the expected scope of the backlog candidate based on its description and domain

Move the chosen task to Active, stamp it with your session ID and timestamp, then proceed to **Step 4**.

**3. Every backlog task conflicts with an active task?**
Report clearly which tasks are blocked and why (e.g., "task `api-v2` conflicts with the active `api-auth` task: both touch `src/app/api/`"). Do not force-pick a conflicting task. Stop and wait for the user to add a new task or unblock the situation.

### Stamping format

When claiming a task, update its line in `references/roadmap.md` to include the agent annotation:

```
[~] slug: Feature name   agent:x7k2pa   started:2026-03-15T19:05
```

When a task is marked done (`[x]`), remove the `agent:` and `started:` annotations from the line.

---

## Step 3: Act on user input

When `/ship` is invoked **with no additional input**, treat it as if `start` was specified: resume the active task or pick the next backlog item and proceed to **Step 4** immediately. Do not pause to ask what to do next.

Act immediately after presenting the roadmap (do not ask again):

#### `start` or `continue`

Apply the **concurrent task handling** algorithm (see above) to determine which task to work on:

- If there is a stale `[~]` task: claim it, determine what was already done via `git status` and recent commits, and resume from that point.
- If all active tasks are claimed and a non-conflicting backlog task exists: move it to Active, stamp it, then proceed to **Step 4**.
- If the backlog is empty and no stale task exists: ask the user to input a new task or another action. If a task is provided, add it to the backlog and start it using the same algorithm.

#### `review` or `review roadmap`

Run a full, thorough audit of the codebase and the roadmap:

1. Read all relevant source files and the current `references/roadmap.md` and `references/spec.md`.
2. Identify improvements: missing features, bugs, performance issues, UI/UX gaps, outdated patterns, dead code, etc.
3. Present findings with clear categories (e.g. **Bugs**, **Performance**, **UI**, **Features**, **Housekeeping**).
4. Propose additions, removals, or reprioritisations to the roadmap.
5. If the user confirms, update `references/roadmap.md` with the new tasks.

#### `<task slug>`

Jump directly to a specific task by slug (e.g. `/ship r2-storage`):

- Find the matching task in the roadmap by slug.
- If the task is in the backlog, move it to **Active** (`[~]`), stamp it with your session ID and timestamp, and proceed to **Step 4**. Before starting, verify it does not conflict with any currently claimed task using the concurrency rules above. If it does, warn the user before proceeding.
- If the task is already active, check whether it's stale (see Concurrent task handling). If stale, claim it and resume. If claimed by another session, report that and ask the user to confirm before taking it over.
- If no task matches the slug, say so and list the available slugs from the backlog.

#### Any other input

Interpret the user's request and proceed accordingly. Use your best judgment to determine the most helpful action.

---

### Set session title

This step runs **only after a task has been confirmed and its slug and name are known**. Never attempt it before the task is determined. The slug must already be in hand.

**Title format:** `[ship] <task-slug>: <short description>`

**Example:** `[ship] r2-storage: Migrate from Vercel Blob to Cloudflare R2`

#### In VS Code (Copilot chat)

Load the `run_vscode_command` tool via `tool_search_tool_regex` if not already loaded. Then call it with:

- `commandId`: `workbench.action.chat.rename`
- `args`: `["[ship] <task-slug>: <short description>"]`

Execute this call **up to 5 times in a row without delay** between attempts. Do not check for success between retries. Just fire all 5 calls. After all 5 calls are done (regardless of outcome), move on immediately. Never pause, block, or report failure over a title rename. It is a cosmetic step.

#### In GitHub.com Copilot chat (https://github.com/copilot)

The `run_vscode_command` tool is unavailable in this context. Load the appropriate GitHub tool via `tool_search_tool_regex` (e.g. `mcp_github_update_pull_request` or `mcp_github_create_pull_request`). Whenever a pull request is created or updated during this session (including during `approve and commit`) set its title to `[ship] <task-slug>: <short description>`. This applies on PR creation, reopening, and any time the PR title would otherwise be auto-generated.

#### When `continue` picks a new task

Run this step again for the new task before moving to Step 4. The title must always match the task currently being worked on.

---

## Step 4: Plan

Before writing any code, write a concise implementation plan:

- Which files will be created or modified
- Which `AGENTS.md` patterns apply
- Which skills need to be read (check the skill enforcement rules in `AGENTS.md`; list each by name)
- Any DB schema changes or migrations required
- Any new environment variables required
- Any risks or open questions that should be resolved before starting

Present the plan:

> **Plan: `[slug]` ([Feature name])**
>
> Files: ...
> Patterns: ...
> Skills: ... (or "none" if no skill applies)
> [Any risks or open questions]
>
> **Reply "start" or tell me what to change.**

Wait for confirmation before writing code.

---

## Step 5: Implement

Before writing any code, read all skills listed in the plan from `.agents/skills/`, in parallel if multiple apply. This includes any skills mandated by `AGENTS.md` skill enforcement rules for the type of work being done (e.g. UI work always requires `frontend-design` and `vercel-react-best-practices`).

Implement the feature following **every** convention and pattern defined in `AGENTS.md` exactly. No exceptions.

After implementing, run the project's **check command** (see `AGENTS.md` → Commands table). **The check MUST pass with zero errors** — all TypeScript, lint, format, and unused-export errors must be resolved before presenting results, regardless of whether they were introduced by this feature or pre-existed. There are no exceptions: a failing check blocks all forward progress. Fix every reported error before moving on. Then run the **build command** and fix any build errors as well.

---

## Step 6: Present results

> **Done: [slug] ([Feature name])**
>
> **What was built:**
>
> - ...
> - ...
>
> **Files changed:**
>
> - ...
>
> **Notes:** [edge cases, decisions made, things to test]
>
> **What's next?**
>
> - `approve`: run tests, mark done, update roadmap and all files, stop (no commit)
> - `approve and commit` / `commit`: same as approve, then commit using the commit skill
> - `continue`: same as approve and commit, then immediately start the next backlog item
> - `skip`: mark as blocked (`[!]`), move to the next backlog item
> - `stop`: pause here without changing any task status
> - Or tell me what to change.

---

## Step 7: Post-action loop

The user may reply with a **single keyword** (no need to repeat `/ship`):

### `approve`

> **MANDATORY order — do not skip or reorder these steps:**

1. Run the project's **check command** (`pnpm run check`). It MUST exit with code 0. Fix every error before proceeding.
2. Mark the feature `[x]` with a completion date in `references/roadmap.md`.
3. Add any architectural decisions to the **Decisions log**.
4. Update `AGENTS.md` if new routes, hooks, utilities, or patterns were introduced.
5. Update `references/spec.md` if the feature changed or clarified the app spec.
6. Stop the workflow. Changes are NOT committed — use `approve and commit` or `commit` to also commit.

### `approve and commit` / `commit`

> **MANDATORY order — do not skip or reorder these steps:**

1. Perform all steps from `approve` (run check, mark done, update roadmap, update `AGENTS.md`, update `references/spec.md`).
2. Read `.agents/skills/commit/SKILL.md` and execute the commit skill in full: stage all changes (including roadmap, `AGENTS.md`, and any formatting-only diffs), compose a conventional commit message, and commit.
3. After the commit, run `git status` to verify the working tree is completely clean. If it is not, stage the remaining changes and amend or add a follow-up commit before declaring done.
4. Stop the workflow.

### `continue`

> **MANDATORY order — do not skip or reorder these steps:**

1. Perform all steps from `approve and commit` (run check, mark done, update roadmap, update `AGENTS.md`, update `references/spec.md`, commit).
2. Immediately loop back to **Step 2**, pick the next backlog item, and run the **Set session title** step for the new task before proceeding to Step 4.

### `skip`

Mark the current task as blocked (`[!]`) in `references/roadmap.md` with a brief note, then loop back to **Step 2** and pick the next available backlog item.

### `stop`

Pause the workflow without changing any task status. Summarize where things stand so the session can be resumed easily next time.

### Any other input

Apply the user's requested changes BEFORE updating task status. Re-run the project's check command (see `AGENTS.md` → Commands table) after applying. Present results again (Step 6) with updated options.

---

## Roadmap slugs: enforcement rules

Every task in `references/roadmap.md` MUST have a unique **slug**:

- **2 words** (hyphen-separated), **maximum 3** only when 2 is ambiguous
- Lowercase, kebab-case, descriptive of the task
- Examples: `admin-certs`, `settings-ui`, `about-page`, `config-crud`, `user-invite`
- Slugs are referenced in chat (e.g. `continue admin-certs`) and in the decisions log

When adding tasks to the roadmap (from any source, including user input and `review`), always assign slugs.

Active tasks in `references/roadmap.md` carry concurrency annotations that MUST be preserved exactly as written by the agent that stamped them. Do not reformat or strip them:

```
[~] slug: Feature name   agent:x7k2pa   started:2026-03-15T19:05
```

When marking a task done, remove the `agent:` and `started:` fields:

```
[x] slug: Feature name   Completed: YYYY-MM-DD
```

---

## Keeping files in sync

After every action, verify and update all three files if needed:

| File                    | What to update                                                             |
| ----------------------- | -------------------------------------------------------------------------- |
| `AGENTS.md`             | New routes, hooks, utilities, components, env vars, patterns introduced    |
| `references/spec.md`    | New features, updated flows, changed business rules, or resolved questions |
| `references/roadmap.md` | Task status changes, new items, decisions log entries, slug assignments    |

> **Important:** `references/spec.md` and `references/roadmap.md` always refer to the files inside this skill's folder (`.agents/skills/ship/references/`), never files at the repository root.

These updates are **automatic and mandatory**. No user confirmation needed.
