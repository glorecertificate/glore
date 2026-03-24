---
name: ship
description: The primary development orchestrator for this project. Invoked via `/ship` to check roadmap status, start or continue tasks, implement features with parallel subagents, and loop until the backlog is clear. Ship is the only entry point for all development work. Triggers on `/ship`, "start", "continue", "ship", "review", "next task", or "backlog".
compatibility: Designed for Claude Code and VS Code Copilot Chat. The session title step uses the run_vscode_command tool. On GitHub.com Copilot, it falls back to PR title updates instead.
argument-hint: start | continue | review | add <description> | <slug>
---

You are the lead engineer on this project. Your job is to keep the roadmap moving: present the current status, pick the next task, ask clarifying questions when needed, implement it using the right internal workflows, and loop until the backlog is clear.

Ship is the **only orchestrator** for this codebase. All development work starts and ends here. Workflow skills (brainstorming, TDD, systematic debugging, etc.) are invoked by ship at the right moments — you do not need to invoke them separately.

---

## Preliminary checks

Run these checks **every time** `/ship` is invoked, before doing anything else.

### 1. AGENTS.md

Check for `AGENTS.md` in the repository root. If the file is **missing** or **empty**, stop immediately and say:

> `AGENTS.md` is <missing/empty>. This file is the single source of truth for agent conventions. Create it before running `/ship`.

### 2. Spec and roadmap location

The canonical project documents live in `.agents/specs/`:

- `.agents/specs/app.md` — what the app does and business rules
- `.agents/specs/roadmap.md` — feature status, backlog, and decisions log

---

## Step 1: Load context

Read all three files **in parallel**:

- `AGENTS.md` — coding conventions, architecture, enforced patterns
- `.agents/specs/app.md` — canonical app specification and business rules
- `.agents/specs/roadmap.md` — current roadmap state

If `.agents/specs/app.md` is missing or empty, stop and say:

> `.agents/specs/app.md` is missing. Create it with your app description before running `/ship`.

---

## Step 2: Present the roadmap

**Every time `/ship` is invoked**, present the current roadmap state:

```
📦 Roadmap: [Project name]

🔄 Active
  [~] slug: Feature name   (agent: x7k2pa, started: YYYY-MM-DD HH:MM)
  [~] slug: Feature name   (stale, no active agent)

📋 Backlog
  P0 [ ] slug: Feature name   (notes if any)
  P1 [ ] slug: Feature name

✅ Done (N completed)
  [x] slug: Feature name   Completed: YYYY-MM-DD
```

If the backlog is empty and nothing is active, say:

> The backlog is empty. Add features with `/ship add <description>`.

---

## Concurrent task handling

Multiple agents can work on this project simultaneously. Every time a `/ship` session starts, it must assess the current concurrency state before choosing what to work on.

### Session ID

Generate a random 6-character alphanumeric string (e.g. `x7k2pa`) at the start of each session. Use it consistently when stamping tasks in `.agents/specs/roadmap.md` for the duration of that session.

### Staleness

A `[~]` task is **stale** when:

- It carries no `agent:` annotation, or
- It has an `agent:` annotation but that session has left no recent git activity tied to it. Check `git log --oneline -20` for commits referencing the slug; if none exist within a reasonable window (a few hours), treat the task as abandoned.

A `[~]` task is **claimed** when it has a valid `agent:` annotation with recent matching git activity.

### Task selection algorithm

Follow these steps in order whenever choosing what to work on:

**1. Stale active task?**
Scan all `[~]` tasks. If any are stale, pick the highest-priority one (top of Active section), claim it by stamping your session ID and timestamp, check git history to understand what was already done, and resume from there.

**2. All active tasks claimed?**
Scan the `[ ]` backlog in priority order (P0 first, then P1, P2, P3). Pick the first task that does not conflict with any currently claimed task. Two tasks **conflict** when they modify the same files, modules, data tables, or domain areas.

**3. Every backlog task conflicts?**
Report clearly which tasks are blocked and why (e.g., "task `api-v2` conflicts with the active `api-auth` task: both touch `src/app/api/`"). Do not force-pick a conflicting task. Stop and wait for the user to add a new task or unblock the situation.

### Stamping format

When claiming a task, update its entry in `.agents/specs/roadmap.md`:

```
[~] slug: Feature name   agent:x7k2pa   started:2026-03-15T19:05
```

When a task is completed (`[x]`), remove the `agent:` and `started:` annotations from the line.

---

## Step 3: Act on user input

### `/ship` (no args)

Stop after presenting the roadmap. Tell the user to reply **`start`** to start the first item in the backlog or continue the first pending one. Do not act yet.

### `start`

Pick the first non-conflicting task from the **backlog** (`[ ]`), move it to Active, stamp it with your session ID and timestamp, and proceed to **Step 4** without asking for confirmation.

If the backlog is empty, tell the user there are no backlog items and ask them to add a task with `/ship add <description>`.

### `continue`

Look for the first `[~]` task that has **no valid active agent** (i.e. stale or unclaimed). Claim it by stamping your session ID and timestamp, check `git status` and recent commits to understand what was already done, and resume from that point without asking for confirmation.

If there are no pending (`[~]`) tasks or all are claimed by another session, tell the user there is nothing pending and immediately pick the first non-conflicting backlog task, move it to Active, stamp it, and proceed to **Step 4** — all without asking for confirmation.

### `add <description>` or `add`

Add one or more tasks to the backlog:

1. Parse the description and assign a slug (kebab-case, max 40 chars, derived from the title).
2. Ask which priority tier if ambiguous (P0 = critical/blocking, P1 = high importance, P2 = polish/medium, P3 = low/DX).
3. Append the task to the appropriate section in `.agents/specs/roadmap.md`.
4. Present a brief recap of the updated roadmap.
5. Tell the user to reply `start` to begin the added task.

When the user provides **multiple items** to add in the same message, add all of them, sort within their tier, then present a brief recap and tell the user to reply `start` to start the first item in the backlog.

### `review` or `review roadmap`

For a **quick review**, read the roadmap and suggest additions, removals, or reprioritisations. Update `.agents/specs/roadmap.md` if the user confirms.

For a **full codebase audit**, dispatch parallel subagents:

1. Read `.agents/specs/app.md` and `.agents/specs/roadmap.md` to understand scope.
2. Load `.agents/skills/dispatching-parallel-agents/SKILL.md`.
3. Dispatch 7 parallel `Explore` subagents, each focused on one review domain:
   - `features` — missing features, incomplete flows, UX gaps, untested edge cases
   - `performance` — bundle size, RSC/Suspense patterns, caching strategy, slow queries
   - `code-org` — file structure, module boundaries, naming conventions, coupling
   - `scalability` — DB schema design, query efficiency, cache invalidation patterns
   - `security` — auth configuration, cookie security, input validation, RBAC gaps
   - `dx` — linting config, TypeScript strictness, tooling, test coverage gaps
   - `infra` — Vercel config, R2/Neon setup, env var validation, deployment pipeline
4. Aggregate findings, assign kebab-case slugs, rank by severity (critical → high → medium → low).
5. Present findings to the user with proposed roadmap additions.
6. If confirmed, append new items to `.agents/specs/roadmap.md` and write the full review to `.agents/reviews/YYYY-MM-DD-review.md`.

### `<task slug>`

Jump directly to a specific task by slug (e.g. `/ship upload-endpoint-unauthenticated`):

- Find the matching task in the roadmap by slug.
- If in the backlog, move it to **Active** (`[~]`), stamp it, and proceed to **Step 4**. Verify it does not conflict with any currently claimed task. If it does, warn the user before proceeding.
- If already active, check whether it is stale. If stale, claim it and resume. If claimed by another session, report that and ask the user to confirm before taking it over.
- If no task matches the slug, say so and list the available slugs from the backlog.

### Any other input

Interpret the user's request and proceed accordingly. Use your best judgment to determine the most helpful action.

---

## Set session title

This step runs **only after a task has been confirmed and its slug and name are known**. Never attempt it before the task is determined.

**Format:** `[ship] <task-slug>: <short description>`

**Example:** `[ship] upload-endpoint-unauthenticated: Add auth to R2 upload route`

### In VS Code (Copilot chat)

Load the `run_vscode_command` tool via `tool_search_tool_regex` if not already loaded. Then call it with:

- `commandId`: `workbench.action.chat.rename`
- `args`: `["[ship] <task-slug>: <short description>"]`

Execute this call **up to 5 times in a row without delay** between attempts. Do not check for success between retries. After all 5 calls are done, move on immediately. Never pause, block, or report failure over a title rename — it is a cosmetic step.

### In GitHub.com Copilot chat

Load the appropriate GitHub tool via `tool_search_tool_regex`. Whenever a pull request is created or updated during this session, set its title to `[ship] <task-slug>: <short description>`.

### When `continue` picks a new task

Run this step again for the new task before moving to Step 4.

---

## Step 4: Context gathering

Before planning, assess whether the task needs clarification. Ask questions **only when**:

- The task has multiple valid implementation approaches with meaningful tradeoffs
- The task description is ambiguous about scope or expected behavior
- The task touches security, auth, or schema — high-stakes areas where a wrong choice is hard to reverse
- The task could conflict with in-progress work you are uncertain about

When questions are needed, present a concise numbered list:

> Before I plan `[slug]`, I have a few questions:
>
> 1. [Question about scope or approach]
> 2. [Question about behavior or edge cases]
> 3. [Question about constraints or preferences]
>
> Reply with your answers, or say "proceed" to use sensible defaults.

If the user says "proceed" or provides partial answers, fill gaps using the spec, existing patterns in the codebase, and sensible defaults. Document the defaults chosen in the plan.

**Do not ask questions for:**

- Well-specified tasks with a single clear implementation path
- Minor fixes, configuration changes, or formatting
- Tasks where the spec + roadmap notes already answer every relevant question

---

## Step 5: Plan

After gathering context, write a concise implementation plan before touching any code.

For **complex or multi-domain tasks**, read `.agents/skills/brainstorming/SKILL.md` first:

- Present 2-3 design approaches with tradeoffs
- Wait for design approval before planning implementation steps
- Save the approved design to `.agents/specs/YYYY-MM-DD-<slug>-design.md` if warranted

For **well-scoped tasks**, present a direct plan:

> **Plan: `[slug]` ([Feature name])**
>
> Files: ...
> Patterns: ...
> Skills: ... (or "none")
> Migration: ... (or "none")
> Risks: ... (or "none")
>
> **Reply "start" to proceed, or tell me what to change.**

**Skip the pause and proceed directly to Step 6** if the workflow was initiated via `start` or `continue`.

---

## Step 6: Implement

### Pre-implementation

Read all skills listed in the plan from `.agents/skills/`, in parallel when multiple apply. Always include domain-specific skills per `AGENTS.md` enforcement rules — for example, UI work always requires `frontend-design` and `vercel-react-best-practices`.

Before any feature or bug fix, read `.agents/skills/test-driven-development/SKILL.md` and follow the RED-GREEN-REFACTOR cycle:

1. Write the failing test first
2. Watch it fail
3. Write minimal code to pass
4. Refactor

For bugs, read `.agents/skills/systematic-debugging/SKILL.md` first. Find the root cause before writing any fix.

### Parallel subagent dispatch

When a task has clearly independent sub-problems that do not share files or state, dispatch parallel subagents for maximum speed:

1. Load `.agents/skills/dispatching-parallel-agents/SKILL.md`.
2. Define clear, non-overlapping scopes for each subagent (specific files, modules, or domains).
3. Dispatch using `runSubagent` with the `Principal` agent for implementation work, or `Explore` for research.
4. Each subagent receives: scoped instructions, the files to modify, and the `AGENTS.md` conventions to follow.
5. Aggregate results when all subagents complete. Resolve any conflicts before presenting to the user.

**Examples of tasks that benefit from parallel subagents:**

- Adding auth checks to multiple unrelated API routes simultaneously
- Fixing lint or type errors across independent modules
- Implementing UI-only changes in N feature pages with no shared state
- Running a security audit across auth, storage, and API domains in parallel

### Implementation rules

Apply **every** convention and pattern defined in `AGENTS.md` exactly. No exceptions.

After implementing, run the check command:

```bash
pnpm run check
```

**The check MUST pass with zero errors.** Fix every TypeScript, lint, format, and unused-export error before presenting results — regardless of whether they pre-existed or were introduced by this task.

Then run the build command:

```bash
pnpm run build
```

Fix any build errors before presenting results.

---

## Step 7: Present results

> **Done: `[slug]` ([Feature name])**
>
> **What was built:**
>
> - ...
>
> **Files changed:**
>
> - ...
>
> **Notes:** [edge cases, decisions made, things to test manually]
>
> **What's next?**
>
> - `approve` — run final checks, mark done, update roadmap and docs, stop (no commit)
> - `approve and commit` / `commit` / `finalize` — same as approve, then commit
> - `continue` — same as approve and commit, then immediately start the next backlog item
> - `skip` — mark as blocked (`[!]`), move to the next backlog item
> - `stop` — pause without changing any task status
> - Or tell me what to change.

---

## Step 8: Post-action loop

### `approve`

> **MANDATORY order — do not skip or reorder:**

1. Run `pnpm run check`. Must exit with code 0. Fix every error before proceeding.
2. Read `.agents/skills/verification-before-completion/SKILL.md`. Confirm output evidence before claiming done.
3. Mark the feature `[x]` with a completion date in `.agents/specs/roadmap.md`.
4. Add any architectural decisions to `.agents/specs/decisions.md`.
5. Update `AGENTS.md` if new routes, hooks, utilities, or patterns were introduced.
6. Update `.agents/specs/app.md` if the feature changed or clarified the app spec.
7. Stop. Changes are NOT committed — use `approve and commit` or `commit` to also commit.

### `approve and commit` / `commit` / `finalize`

> **MANDATORY order — do not skip or reorder:**

1. Perform all steps from `approve` (check, mark done, update roadmap, update `AGENTS.md`, update spec).
2. Read `.agents/skills/commit/SKILL.md` and execute the commit workflow in full: stage all changes (including roadmap, `AGENTS.md`, and any formatting-only diffs), compose a conventional commit message, and commit.
3. After committing, run `git status` to verify the working tree is completely clean. If it is not, stage the remaining changes and amend or add a follow-up commit before declaring done.
4. Stop.

### `continue`

> **MANDATORY order — do not skip or reorder:**

1. Perform all steps from `approve and commit`.
2. Loop back to **Step 2**, pick the next backlog item, set the session title for the new task, and proceed to Step 4.

### `skip`

Mark the current task as blocked (`[!]`) in `.agents/specs/roadmap.md` with a brief note, then loop back to Step 2 and pick the next available backlog item.

### `stop`

Pause without changing any task status. Summarize current state so the session can be resumed easily next time.

### Any other input

Apply the user's requested changes BEFORE updating task status. Re-run `pnpm run check` after applying. Present results again (Step 7) with updated options.

---

## Internal workflows

Ship invokes these skills automatically at the appropriate moments. You do not need to invoke them separately outside of a ship session.

| When                                   | Skill                            | How ship uses it                                        |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Complex or ambiguous feature design    | `brainstorming`                  | Step 5: present approaches, wait for approval           |
| Any feature or bug fix                 | `test-driven-development`        | Step 6: RED-GREEN-REFACTOR before writing code          |
| Bug, test failure, unexpected behavior | `systematic-debugging`           | Step 6: find root cause before proposing a fix          |
| Independent sub-problems in one task   | `dispatching-parallel-agents`    | Step 6: dispatch parallel subagents for speed           |
| Full codebase audit (`review` command) | `dispatching-parallel-agents`    | Step 3: 7 domain subagents run concurrently             |
| Large feature needing detailed plan    | `writing-plans`                  | Step 5: break into bite-sized tasks with verify steps   |
| Executing a written plan               | `executing-plans`                | Step 6: run plan tasks with human checkpoints           |
| Before marking any task done           | `verification-before-completion` | Step 8: confirm output before claiming done             |
| Committing changes                     | `commit`                         | Step 8: stage, compose message, commit                  |
| Feature branch isolation               | `using-git-worktrees`            | Before Step 5: isolated workspace on a new branch       |
| Completing a feature branch            | `finishing-a-development-branch` | After approve: verify, present merge/PR/discard options |
| After completing a task                | `requesting-code-review`         | Before declaring done: dispatch reviewer subagent       |
| Code review feedback received          | `receiving-code-review`          | Verify each suggestion before implementing              |
