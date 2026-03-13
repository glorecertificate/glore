---
name: start
description: Start the next implementation cycle: pick the next feature from ROADMAP.md, plan it, implement it, then ask for review.
---

You are the lead engineer on this project. Your job is to autonomously implement the next feature in the backlog and ask for a review when done.

**Follow this exact protocol on every run:**

## Immediate action — Rename the chat

**This is the very first thing you MUST do before reading any file or producing any output.**

1. Call `tool_search_tool_regex` with pattern `run_vscode_command` to load the tool.
2. Call `run_vscode_command` with command `workbench.action.chat.rename` and args `["/start"]`.

Do not skip this step. Do not read files first. Do not greet the user first. Rename the chat first.

---

## Step 0 — Setup

Check for a `.gitignore` file in the skill folder (`.agents/skills/start/`):

**If `.gitignore` exists (default):**

- `SPEC.md` and `ROADMAP.md` are **private** — git-ignored and not tracked in the repository.
- They must be shared with team members out-of-band (e.g., shared drive, internal wiki, or direct file handoff).
- If either file is **missing**, create it now using the canonical template below, then proceed to Step 1.

**If `.gitignore` is absent:**

- `SPEC.md` and `ROADMAP.md` are **tracked in the repository** — visible to all contributors via version control.
- No special handling required.

### Canonical templates

If `SPEC.md` is missing, create it with:

```markdown
# App Specification

> **Agent instructions:** Read this file at the start of every session and before picking up any feature from ROADMAP.md. This is the canonical description of what the application does, who uses it, and what the expected behavior is. Never implement anything that contradicts this spec without first flagging it to the user.

---

## Overview

<!-- One paragraph describing the app at a high level. What is it, who is it for, what problem does it solve? -->

## Users & roles

<!-- Who are the users? What roles exist? What can each role do? -->

| Role | Description | Permissions |
| ---- | ----------- | ----------- |
|      |             |             |

## Core features

<!-- A numbered list of the major features. Be as detailed as needed. Sub-bullets for specifics. -->

1.
2.
3.

## User flows

<!-- Describe the key flows a user goes through. Step-by-step for each important interaction. -->

### Flow 1: [Name]

1.
2.
3.

## Data model (high level)

<!-- What are the main entities? How do they relate? Don't need to be SQL-precise here. -->

## Business rules

<!-- Constraints, validations, edge cases that MUST be enforced. The agent will treat these as hard requirements. -->

## Out of scope

<!-- Features explicitly NOT included in this version. Prevents scope creep. -->

## Open questions

<!-- Unresolved decisions. Agent will surface these before implementing anything that depends on them. -->
```

If `ROADMAP.md` is missing, create it with:

```markdown
# Roadmap

> **Agent instructions:** Read this file at the start of every session. Update it immediately after completing a milestone or making a structural decision. This is the source of truth for feature status and priorities.

## How to start

1. Fill in `SPEC.md` with the full app description
2. Add features to the **Backlog** below (ordered by priority, top = first)
3. Open Copilot Chat → run `.github/prompts/start.prompt.md` (click the Play button)
4. The agent picks the top backlog item, plans it, implements it, and asks for your review
5. Reply `"approve"` to move to the next feature, or request changes

---

## Status key

| Symbol | Meaning           |
| ------ | ----------------- |
| `[ ]`  | Not started       |
| `[~]`  | In progress       |
| `[x]`  | Done              |
| `[!]`  | Blocked / on hold |

---

## Active features

_List features currently being developed, one per branch._

---

## Backlog

_Ordered list of upcoming features. Top = highest priority._

---

## Decisions log

_Brief notes on architectural decisions made. Prevents re-litigating the same choices across sessions._

| Date | Decision | Rationale |
| ---- | -------- | --------- |
```

After creating any missing files, continue to Step 1.

## Step 1 — Load context

Read these files in order:

1. `AGENTS.md` — coding conventions, architecture, enforced patterns
2. [`SPEC.md`](./SPEC.md) — what the app does and what the business rules are
3. [`ROADMAP.md`](./ROADMAP.md) — current feature status and decisions log

If `SPEC.md` is empty or only contains the template placeholder text, stop immediately and say:

> "SPEC.md is empty. Fill it in with your app description, then run Start again."

## Step 2 — Pick the next feature

Look at the ROADMAP.md **Active features** section for any `[~]` items. If one exists, resume it.

If no active feature, pick the **top** `[ ]` item from the **Backlog** section and move it to **Active features**, marking it `[~]`.

If both sections are empty, say:

> "The backlog is empty. Add features to ROADMAP.md → Backlog, then run Start again."

Update ROADMAP.md to reflect the new active feature before proceeding.

Then immediately update the chat session title to `/start <feature name>` (e.g. `/start Certificate request form`):

- Call `run_vscode_command` with command `workbench.action.chat.rename` and args `["/start <feature name>"]`.

Do not skip this step. The rename must happen before presenting the plan.

## Step 3 — Resolve open questions

Check SPEC.md **Open questions** and ROADMAP.md for anything that must be answered before implementing this feature. If a blocking question exists, surface it now and stop:

> "Before I implement [feature], I need to know: [question]"

Wait for the user's answer, update SPEC.md or ROADMAP.md accordingly, then continue.

## Step 4 — Plan

Switch to Plan mode internally. Write a concise implementation plan:

- Which files will be created or modified
- Which AGENTS.md patterns apply
- Which skills need to be read (check the skill enforcement rules in AGENTS.md)
- Any DB schema changes or migrations required
- Any new environment variables required

Present the plan to the user in a brief format:

> **Plan: [Feature name]**
> Files: ...
> Patterns: ...
> Skills needed: ...
> [Any questions or risks]
>
> **Reply "go" to start, or tell me what to change.**

Wait for confirmation.

## Step 5 — Implement

Read all required skills from `.agents/skills/` before writing any code.

Implement the feature following AGENTS.md conventions exactly:

- Arrow functions only, no `function` keyword
- No explicit return types unless required
- Early returns, no else/else-if
- Named exports, no default exports except pages
- No comments unless logic is non-obvious
- All strings through next-intl (no JSX string literals)
- Use existing utilities from `src/lib/utils.ts` before creating new ones
- Run `pnpm check` mentally — your code must pass tsc, oxlint, and oxfmt

After implementation, run:

```
pnpm check
```

Fix all errors, then run:

```
pnpm build
```

Fix any build errors before proceeding. Verify the build output is correct and complete.

## Step 6 — Review request

Present a summary to the user:

> **Done: [Feature name]**
>
> **What was built:**
> [2-4 bullet points describing what was implemented]
>
> **Files changed:**
> [list]
>
> **To review:** [any specific areas to check, edge cases to test, or decisions made that the user should know about]
>
> **Reply "approve" to mark done and pick the next feature, or tell me what to change.**

## Step 7 — Close the loop

On approval:

1. Mark the feature `[x]` in ROADMAP.md
2. Add any architectural decisions made to the **Decisions log**
3. Update AGENTS.md if any new patterns, routes, hooks, or utilities were added
4. Automatically re-run Step 2 to pick the next feature

On change request:

- Apply the requested changes
- Re-run `pnpm check`
- Return to Step 6

---

**Rules:**

- Never skip `pnpm check` and `pnpm build` before asking for review
- Never implement two features at once
- Never modify AGENTS.md conventions without flagging it as a decision
- Never add dependencies without checking if something in the existing stack already covers the need
- If blocked by something external (env var missing, schema conflict, etc.), stop and explain clearly
