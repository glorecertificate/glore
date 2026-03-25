---
name: ship
description: >
  The primary development orchestrator for this project. Use ship for ANY development work: starting a task, executing features, fixing bugs, reviewing the codebase, checking the roadmap, or committing changes. Ship is the only entry point for all development — it validates context, selects tasks, drives a 5-phase execution pipeline, and delegates to superpowers skills at the right moments. Invoke it via /ship, with a command (run, next, continue, scan, roadmap, specs), or with a task slug to target a specific item.
argument-hint: run | next | continue | scan | roadmap | specs | <slug>
---

# Ship

Ship is the sole development orchestrator for this codebase. All work flows through ship — it loads context, selects tasks, drives them through a structured pipeline, and loops until the backlog is clear. Superpowers skills handle specialized work (design, TDD, debugging, review, commits). Ship invokes them at the right moment; it never duplicates their logic.

---

## Startup

Run these checks on every invocation, before processing any command.

### 1. Validate required files

| File                       | Required | If missing or empty                                                                                 |
| -------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                | Yes      | Stop: "`AGENTS.md` is missing. Create it before running ship."                                      |
| `.agents/specs/app.md`     | Yes      | Stop: "`.agents/specs/app.md` is missing. Create it with your app description before running ship." |
| `.agents/specs/roadmap.md` | Yes      | Continue with empty roadmap state.                                                                  |

### 2. Load context in parallel

- `AGENTS.md` — conventions, architecture, enforced patterns
- `.agents/specs/app.md` — app specification and business rules
- `.agents/specs/roadmap.md` — current roadmap state

### 3. Generate session ID

Create a random 6-character alphanumeric string (e.g. `x7k2pa`). Use it consistently when stamping tasks claimed during this session.

---

## Commands

Match input exactly against the table below. `run` and no arguments are strict aliases. Task slugs are matched against roadmap entries when no command matches.

| Command           | Behavior                                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run` / (no args) | Autonomous loop. Execute all backlog tasks sequentially with zero confirmations. Pause only for blocking questions (ambiguous design, missing information that cannot be inferred). Loop until the backlog is empty. |
| `next`            | Single task. Execute the next available backlog task, present results, then stop.                                                                                                                                    |
| `continue`        | Resume. Claim the first pending or interrupted (`[~]`) task. Check git history for prior work and resume from there. If no `[~]` tasks exist, inform the user. Do not auto-pick from the backlog.                    |
| `<task-slug>`     | Targeted. Execute the task matching this slug, present results, then stop. If the slug matches no roadmap entry, ask the user how to proceed. Do not guess or skip.                                                  |
| `scan`            | Codebase audit. Dispatch parallel subagents across 7 review domains. Populate the roadmap with findings (gaps, bugs, refactors, tech debt). Each item includes a one-line rationale. Require confirmation to commit. |
| `roadmap`         | Display the full roadmap, then show available commands.                                                                                                                                                              |
| `specs`           | Display a structured recap of `.agents/specs/app.md`, then show available commands.                                                                                                                                  |

### Roadmap display format

Use this format whenever displaying the roadmap:

```
📦 Roadmap: [Project name]

🔄 Active
  [~] slug: Feature name   agent:x7k2pa   started:YYYY-MM-DDTHH:MM

📋 Backlog
  P0 [ ] slug: Feature name
  P1 [ ] slug: Feature name

✅ Done (N completed)
  [x] slug: Feature name   completed:YYYY-MM-DD
```

If the backlog is empty and nothing is active, show:

> The backlog is empty. Use `scan` to audit the codebase and populate the roadmap, or add items to `.agents/specs/roadmap.md` directly.

### Available commands prompt

Show this after every stopping point:

```
What's next?
  run       — execute all remaining tasks autonomously
  next      — execute one task, then stop for feedback
  continue  — resume a pending task
  scan      — audit codebase and update roadmap
  roadmap   — view the full roadmap
  specs     — view project specifications
  <slug>    — execute a specific task by slug
```

---

## Task selection

1. **Stale active?** Check all `[~]` tasks. A task is stale when it has no `agent:` annotation, or its annotated agent has no recent git activity (`git log --oneline -20`). Claim the highest-priority stale task.
2. **All active claimed?** Pick the first `[ ]` backlog item (P0 first) that does not conflict with any claimed task. Tasks conflict when they touch the same files, modules, tables, or domain areas.
3. **All tasks conflict?** Report which tasks are blocked and why. Stop and show available commands.

### Stamping

When claiming: `[~] slug: Feature name   agent:x7k2pa   started:2026-03-15T19:05`

When completing: `[x] slug: Feature name   completed:2026-03-15`

Remove `agent:` and `started:` annotations on completion.

---

## Execution pipeline

Every task flows through five phases. Read and follow the relevant superpowers skill at each phase — never approximate their logic inline.

### Phase 1: Context

Clarify ambiguities before planning. Ask only when:

- Multiple valid approaches exist with meaningful tradeoffs
- The description is ambiguous about scope or behavior
- The task touches high-stakes areas (security, auth, schema)
- Potential conflict with in-progress work

For well-specified tasks with a single clear path, skip directly to Phase 2.

When questions are needed, present them as a concise numbered list:

> Before I plan `[slug]`, I have a few questions:
>
> 1. [Question]
> 2. [Question]
>
> Reply with answers, or say "proceed" for sensible defaults.

### Phase 2: Plan

**Complex or ambiguous features:**

1. Read `.agents/skills/brainstorming/SKILL.md`. Present 2-3 design approaches with tradeoffs.
2. Wait for design approval. This is a blocking question even in `run` mode — proceeding with the wrong design wastes far more time than a brief pause.
3. Save the approved design to `.agents/specs/YYYY-MM-DD-<slug>-design.md`.
4. Read `.agents/skills/writing-plans/SKILL.md` to break the design into bite-sized tasks.

**Well-scoped tasks:**

Write a direct inline plan and proceed without pause:

```
Plan: [slug] ([Feature name])
  Files: ...
  Skills: ... (or "none")
  Migration: ... (or "none")
  Risks: ... (or "none")
```

### Phase 3: Implement

1. **Load domain skills.** Read all relevant skills from `.agents/skills/` per AGENTS.md enforcement rules. For UI work, load `frontend-design` + `vercel-react-best-practices`. Load in parallel when multiple apply.

2. **TDD.** Read `.agents/skills/test-driven-development/SKILL.md`. Follow RED-GREEN-REFACTOR: write a failing test, verify it fails for the right reason, write minimal code to pass, refactor while staying green.

3. **Debugging.** For bugs or unexpected behavior: read `.agents/skills/systematic-debugging/SKILL.md`. Find the root cause before writing any fix.

4. **Parallel work.** When sub-problems are clearly independent (no shared files or state): read `.agents/skills/dispatching-parallel-agents/SKILL.md`. Dispatch subagents with non-overlapping scopes, each receiving scoped instructions, target files, and AGENTS.md conventions.

5. **Plan execution.** For written plans with multiple tasks: read `.agents/skills/subagent-driven-development/SKILL.md` for same-session execution with fresh subagents per task, or `.agents/skills/executing-plans/SKILL.md` for parallel-session execution with human checkpoints.

6. **Conventions.** Apply every pattern in AGENTS.md without exception.

### Phase 4: Verify

1. Run `pnpm run check`. Fix every error until it exits 0.
2. Run `pnpm run build`. Fix every build error.
3. Read `.agents/skills/verification-before-completion/SKILL.md`. Confirm with evidence before claiming done.

### Phase 5: Complete

1. Mark task `[x]` with completion date in `.agents/specs/roadmap.md`.
2. Add decisions to `.agents/specs/decisions.md` if applicable.
3. Update `AGENTS.md` if new routes, hooks, utilities, or patterns were introduced.
4. Update `.agents/specs/app.md` if the feature changed the app spec.
5. Read `.agents/skills/commit/SKILL.md`. Stage all changes (including roadmap, AGENTS.md, formatting diffs), compose a conventional commit message, and commit.
6. Run `git status`. If the working tree is not clean, stage remaining changes and amend.

---

## Post-task behavior

### In `run` mode

After Phase 5, loop back to task selection immediately. No pause, no results presentation. Continue until the backlog is empty.

When the backlog is empty:

> All tasks complete. Use `scan` to find new work or add items to the roadmap.

Then show available commands.

### In `next`, `<slug>`, and `continue` modes

Present results after Phase 4 (before committing), then stop:

```
Done: [slug] ([Feature name])

What was built:
  - ...

Files changed:
  - ...

Notes: [edge cases, decisions, manual testing needed]
```

Then show available commands. The user may:

- Type a command (`run`, `next`, etc.) to commit and proceed
- Give feedback to revise (re-verify and re-present after changes)
- Say `stop` to pause without committing
- Say `skip` to mark the task as blocked (`[!]`) and move on

---

## Scan

1. Read `.agents/specs/app.md` and `.agents/specs/roadmap.md`.
2. Read `.agents/skills/dispatching-parallel-agents/SKILL.md`.
3. Dispatch parallel subagents across these review domains:
   - **features** — missing features, incomplete flows, UX gaps
   - **performance** — bundle size, RSC/Suspense, caching, slow queries
   - **code-org** — file structure, boundaries, naming, coupling
   - **scalability** — schema design, query efficiency, cache invalidation
   - **security** — auth, cookies, input validation, RBAC gaps
   - **dx** — lint config, TypeScript strictness, tooling, test coverage
   - **infra** — deployment, storage, env validation, CI/CD
4. Aggregate findings. Assign kebab-case slugs. Rank by severity. Include a one-line rationale per item.
5. Print the proposed roadmap additions.
6. Wait for user confirmation before writing to `.agents/specs/roadmap.md`.
7. Show available commands.

---

## Superpowers delegation

Read the skill file and follow its process. Never approximate a superpower's logic inline — the skill exists because the problem is non-trivial.

| Situation                          | Skill                            | When in pipeline              |
| ---------------------------------- | -------------------------------- | ----------------------------- |
| Complex or ambiguous feature       | `brainstorming`                  | Phase 2 — design exploration  |
| Large multi-step feature           | `writing-plans`                  | Phase 2 — task breakdown      |
| Any code change                    | `test-driven-development`        | Phase 3 — RED-GREEN-REFACTOR  |
| Bug or unexpected behavior         | `systematic-debugging`           | Phase 3 — root cause first    |
| Independent sub-problems           | `dispatching-parallel-agents`    | Phase 3 — parallel subagents  |
| Executing a written plan           | `subagent-driven-development`    | Phase 3 — fresh subagent/task |
| Executing plan in parallel session | `executing-plans`                | Phase 3 — human checkpoints   |
| Before claiming done               | `verification-before-completion` | Phase 4 — evidence required   |
| Committing changes                 | `commit`                         | Phase 5 — stage and commit    |
| After task completion              | `requesting-code-review`         | Phase 5 — dispatch reviewer   |
| Receiving review feedback          | `receiving-code-review`          | Phase 5 — verify before act   |
| Feature branch isolation           | `using-git-worktrees`            | Before Phase 2 — isolation    |
| Merging completed work             | `finishing-a-development-branch` | After Phase 5 — merge/PR      |
| Codebase audit                     | `dispatching-parallel-agents`    | `scan` — 7 domain subagents   |

---

## Session title

After a task slug is known, set the session title. Re-run on task switch. This is cosmetic — never pause or report failure.

**Format:** `[ship] <task-slug>: <short description>`

**In VS Code (Copilot Chat):** Call `run_vscode_command` with `commandId: workbench.action.chat.rename` and `args: ["[ship] <slug>: <desc>"]`. Fire up to 5 times without checking success between attempts.

**In GitHub.com Copilot:** Set the PR title to `[ship] <slug>: <desc>` when creating or updating a pull request.
