---
name: ship
description: Ship the next feature from the roadmap. See the backlog status, pick the next task, implement it and loop until done. Use when users want to implement a feature, work on the backlog, start or resume a task, manage the roadmap, or run a codebase review. Trigger with `/ship` or whenever the user mentions "continue", "ship", "review", "next task", or "backlog".
argument-hint: 'start | review | <task slug> | <custom input>'
---

You are the lead engineer on this project. Your job is to keep the roadmap moving: present the current status, pick the next task, implement it, and loop until the backlog is clear.

---

## Preliminary checks

Run these checks **every time** `/ship` is invoked, before doing anything else.

### 1. AGENTS.md

Check for `AGENTS.md` in the repository root. If the file is **missing** or **empty**, stop immediately and say:

> `AGENTS.md` is <missing/empty>. This file is the single source of truth for agent conventions. Create it before running `/ship`.

### 2. SPEC.md and ROADMAP.md location

`SPEC.md` and `ROADMAP.md` **MUST always live in the repository root**. Always look for them at the root when the skill is invoked. Whether these files are tracked in version control or listed in `.gitignore` is entirely up to the user — the agent MUST NOT touch `.gitignore` or make any decision about it.

### 3. Create missing files from canonical templates

If `SPEC.md` and/or `ROADMAP.md` are missing from the repository root, read the canonical template(s) from:

- `references/spec-template.md` — canonical `SPEC.md` template
- `references/roadmap-template.md` — canonical `ROADMAP.md` template

Create the missing file(s) at the repository root using the corresponding template content, then continue.

---

## Step 1 — Load context

Read all three files in parallel (no need to wait for one before starting the next):

- `AGENTS.md` — coding conventions, architecture, enforced patterns
- `SPEC.md` — what the app does and what the business rules are
- `ROADMAP.md` — current feature status and decisions log

If `SPEC.md` exists but is empty or only contains template placeholder text, stop and say:

> `SPEC.md` is empty. Fill it in with your app description, then run `/ship` again.

---

## Step 2 — Present the roadmap

**Every time `/ship` is invoked**, present the current roadmap state in a clear, readable format:

```
📦 Roadmap — [Project name]

🔄 Active
  [~] slug — Feature name

📋 Backlog
  [ ] slug — Feature name     (notes if any)
  [ ] slug — Feature name

✅ Done (N completed)
  [x] slug — Feature name     Completed: YYYY-MM-DD
  ...

```

If the backlog is empty and nothing is active, say:

> The backlog is empty. Add features to `ROADMAP.md → Backlog`, then run `/ship` again.

---

## Step 3 — Act on user input

When `/ship` is invoked **with no additional input**, treat it as if `start` was specified: resume the active task or pick the next backlog item and proceed to **Step 4** immediately. Do not pause to ask what to do next.

Act immediately after presenting the roadmap (do not ask again):

#### `start` / `sail`

- If there is an active `[~]` task: resume it. To understand where it was left off, check `git status` and the most recent commits — this tells you which files were changed and what was already done. Then continue from that point.
- If there is no active task: pick the **top** `[ ]` item from the backlog. Move it to **Active** in `ROADMAP.md`, marking it `[~]`. Then proceed to **Step 4**.
- If the backlog is empty, ask the user to input a new task or for another action. If a task is provided, add it to the backlog and then start it.

#### `review`

Run a full, thorough audit of the codebase and the roadmap:

1. Read all relevant source files and the current `ROADMAP.md` and `SPEC.md`.
2. Identify improvements: missing features, bugs, performance issues, UI/UX gaps, outdated patterns, dead code, etc.
3. Present findings with clear categories (e.g. **Bugs**, **Performance**, **UI**, **Features**, **Housekeeping**).
4. Propose additions, removals, or reprioritisations to the roadmap.
5. If the user confirms, update `ROADMAP.md` with the new tasks.

#### `<task slug>`

Jump directly to a specific task by slug (e.g. `/ship r2-storage`):

- Find the matching task in the roadmap by slug.
- If the task is in the backlog, move it to **Active** (`[~]`) in `ROADMAP.md` and proceed to **Step 4**.
- If the task is already active, resume it from where it left off.
- If no task matches the slug, say so and list the available slugs from the backlog.

#### Any other input

Interpret the user's request and proceed accordingly. Use your best judgment to determine the most helpful action.

---

## Step 4 — Plan

Before writing any code, write a concise implementation plan:

- Which files will be created or modified
- Which `AGENTS.md` patterns apply
- Which skills need to be read (check the skill enforcement rules in `AGENTS.md`)
- Any DB schema changes or migrations required
- Any new environment variables required

Present the plan:

> **Plan: [slug] — [Feature name]**
>
> Files: ...
> Patterns: ...
> Skills: ...
> [Any questions or risks]
>
> **Reply "go" to start, or tell me what to change.**

Wait for confirmation before writing code.

---

## Step 5 — Implement

Before writing any code, read all skills referenced in the plan from `.agents/skills/`.

Implement the feature following **every** convention and pattern defined in `AGENTS.md` exactly. No exceptions.

After implementing, run the project's **check command** (see `AGENTS.md` → Commands table). If errors exist that pre-date your changes (unrelated to the current feature), note them but do not fix them — only fix errors you introduced. Then run the **build command**. Fix any build errors you introduced before presenting results.

---

## Step 6 — Present results

> **Done: [slug] — [Feature name]**
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
> - `approve` — mark done, update roadmap, stop
> - `approve and commit` — mark done, update roadmap, then commit
> - `continue` — mark done and immediately start the next backlog item
> - `skip` — mark as blocked (`[!]`), move to the next backlog item
> - `stop` — pause here without marking anything done
> - Or tell me what to change.

---

## Step 7 — Post-action loop

The user may reply with a **single keyword** (no need to repeat `/ship`):

### `approve`

1. Mark the feature `[x]` with a completion date in `ROADMAP.md`.
2. Add any architectural decisions to the **Decisions log**.
3. Update `AGENTS.md` if new routes, hooks, utilities, or patterns were introduced.
4. Update `SPEC.md` if the feature changed or clarified the app spec.
5. Stop the workflow.

### `approve and commit`

Perform all steps from `approve`, then execute the `/commit` skill to test, verify, and commit the pending changes.

### `continue`

Perform all steps from `approve`, then immediately loop back to **Step 2** and pick the next backlog item.

### `skip`

Mark the current task as blocked (`[!]`) in `ROADMAP.md` with a brief note, then loop back to **Step 2** and pick the next available backlog item.

### `stop`

Pause the workflow without changing any task status. Summarize where things stand so the session can be resumed easily next time.

### Any other input

Apply the user's requested changes BEFORE updating task status. Re-run the project's check command (see `AGENTS.md` → Commands table) after applying. Present results again (Step 6) with updated options.

---

## Roadmap slugs — enforcement rules

Every task in `ROADMAP.md` MUST have a unique **slug**:

- **2 words** (hyphen-separated), **maximum 3** only when 2 is ambiguous
- Lowercase, kebab-case, descriptive of the task
- Examples: `admin-certs`, `settings-ui`, `about-page`, `config-crud`, `user-invite`
- Slugs are referenced in chat (e.g. `continue admin-certs`) and in the decisions log

When adding tasks to the roadmap (from any source — user input, `review`, etc.), always assign slugs.

---

## Keeping files in sync

After every action, verify and update all three files if needed:

| File         | What to update                                                             |
| ------------ | -------------------------------------------------------------------------- |
| `AGENTS.md`  | New routes, hooks, utilities, components, env vars, patterns introduced    |
| `SPEC.md`    | New features, updated flows, changed business rules, or resolved questions |
| `ROADMAP.md` | Task status changes, new items, decisions log entries, slug assignments    |

These updates are **automatic and mandatory** — no user confirmation needed.

---

## Gitignore enforcement for skills

When creating or modifying the `.agents/skills/.gitignore` file, follow these rules strictly:

- **External skills** (listed in `skills-lock.json`) MUST NOT be tracked. Do NOT add them as exceptions to the gitignore.
- **Custom skills** (created by the user or agent, NOT in `skills-lock.json`) MUST be added as exceptions (`!<skill-name>`) to be tracked.

Before adding any skill to `.gitignore`, check `skills-lock.json`. If it appears there, it is external and must remain ignored.

```gitignore
# CORRECT — only custom/user-created skills are tracked
/*/
!agents-md
!ship

# WRONG — external skills must not be added as exceptions
/*/
!agents-md
!ship
!better-auth-best-practices   ← WRONG, this is in skills-lock.json
!shadcn                       ← WRONG, this is in skills-lock.json
```
