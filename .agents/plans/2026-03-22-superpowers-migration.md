# Superpowers Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `ship` skill workflow with the superpowers workflow as the primary development paradigm, migrating all project documentation to `.agents/specs/` and updating AGENTS.md to encode the full superpowers chain.

**Architecture:** Three-layer migration: (1) create permanent project docs in `.agents/specs/` from ship's spec.md + roadmap.md, (2) make ship local-only by removing it from `.agents/skills/.gitignore`, (3) rewrite AGENTS.md Agent Skills section to encode the superpowers workflow chain with the correct location overrides, removing all ship-based enforcement rules.

**Tech Stack:** Markdown, AGENTS.md conventions, `.agents/` folder structure, superpowers skills from `obra/superpowers`.

---

## File map

| Action | Path                         | Responsibility                                                             |
| ------ | ---------------------------- | -------------------------------------------------------------------------- |
| Create | `.agents/specs/app-spec.md`  | Permanent canonical app specification (replaces `ship/references/spec.md`) |
| Create | `.agents/specs/decisions.md` | Decisions log + remaining backlog (replaces `ship/references/roadmap.md`)  |
| Create | `.agents/plans/.gitkeep`     | Ensures `.agents/plans/` is tracked (plan files themselves are gitignored) |
| Create | `.agents/specs/.gitkeep`     | Ensures `.agents/specs/` is tracked                                        |
| Modify | `.agents/skills/.gitignore`  | Remove `!/ship/` exception so ship folder is local-only                    |
| Modify | `AGENTS.md`                  | Replace ship workflow with superpowers chain throughout                    |

---

## Task 1: Create `.agents/specs/app-spec.md`

**Files:**

- Create: `.agents/specs/app-spec.md`

- [ ] **Step 1: Create the file** with the full app specification, correcting outdated information from spec.md:
  - AI provider: change from "OpenAI (`@ai-sdk/openai`)" to "Google Gemini (`@ai-sdk/google`)" in sections 7 and the AI integration section
  - Open questions: mark Q4 (Gemini vs OpenAI) and Q7 (in-app notifications) as resolved since both features were completed
  - Certificate template path: update from `.agents/skills/ship/assets/certificate-template.pdf` to `.agents/assets/certificate-template.pdf` (will be moved in Task 3)

  File header:

  ```markdown
  # GloRe Certificate — App Specification

  > **Agent instructions:** Read this file at the start of every session and before starting any feature work. This is the canonical description of what the application does, who uses it, and what the expected behavior is. Never implement anything that contradicts this spec without first flagging it to the user.
  >
  > **Location:** `.agents/specs/app-spec.md` — this file is tracked in git.

  ---
  ```

  Then copy verbatim from `.agents/skills/ship/references/spec.md`, applying the three corrections above.

- [ ] **Step 2: Verify the file was created correctly**
  ```bash
  wc -l .agents/specs/app-spec.md
  ```
  Expected: approximately 470 lines.

---

## Task 2: Create `.agents/specs/decisions.md`

**Files:**

- Create: `.agents/specs/decisions.md`

- [ ] **Step 1: Create the file** extracting:
  - The full decisions log table from `roadmap.md`
  - The remaining P3 backlog item (`course-search`)
  - The feature dependency graph (for historical context)

  File header:

  ```markdown
  # GloRe Certificate — Decisions Log

  > **Agent instructions:** Append to this file whenever a meaningful architectural or implementation decision is made. Include the date, the decision, and the rationale. This is the historical record of why the project is the way it is.
  >
  > **Location:** `.agents/specs/decisions.md` — this file is tracked in git.

  ---

  ## Remaining backlog

  | Slug            | Feature                     | Notes                                                                                                     |
  | --------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
  | `course-search` | Course filtering and search | Low priority. Add URL-based filters (type, skill group, language) to `/courses` page. Use nuqs for state. |

  ---
  ```

  Then copy the decisions table and feature dependency graph from `roadmap.md`.

- [ ] **Step 2: Verify the file was created correctly**
  ```bash
  wc -l .agents/specs/decisions.md
  ```
  Expected: approximately 60-70 lines.

---

## Task 3: Move certificate template asset + add gitkeep files

**Files:**

- Create: `.agents/assets/certificate-template.pdf` (copy from ship)
- Create: `.agents/plans/.gitkeep`
- Create: `.agents/specs/.gitkeep`

- [ ] **Step 1: Move the certificate template**

  ```bash
  mkdir -p .agents/assets
  cp .agents/skills/ship/assets/certificate-template.pdf .agents/assets/certificate-template.pdf
  ```

- [ ] **Step 2: Add gitkeep files** so `.agents/plans/` and `.agents/specs/` are tracked as empty directories:

  ```bash
  touch .agents/plans/.gitkeep
  touch .agents/specs/.gitkeep
  ```

- [ ] **Step 3: Update `.gitignore`** to ignore plan files (not the plans directory itself) and ensure `.agents/assets/` is tracked:
      Check the root `.gitignore` for any `.agents/` exclusions and ensure:
  - `.agents/assets/` is NOT ignored
  - `.agents/specs/` is NOT ignored
  - `.agents/plans/` is NOT ignored (but individual plan files could be)

---

## Task 4: Update `.agents/skills/.gitignore`

**Files:**

- Modify: `.agents/skills/.gitignore`

- [ ] **Step 1: Remove the `!/ship/` exception** so the ship folder is no longer tracked in git:

  Current content:

  ```
  /*/
  !/agents-md/
  !/commit/
  !/ship/
  ```

  New content:

  ```
  /*/
  !/agents-md/
  !/commit/
  ```

- [ ] **Step 2: Verify ship is now gitignored**
  ```bash
  git status .agents/skills/ship/
  ```
  Expected: no output (untracked/ignored).

---

## Task 5: Update AGENTS.md — Agent Skills section

**Files:**

- Modify: `AGENTS.md`

This is the largest task. The goal is to replace all ship-based workflow references with the superpowers chain and update all location references.

### 5a: Remove ship from the Installed skills table

- [ ] **Step 1:** In the "Installed skills" table, remove the `ship` row entirely.

### 5b: Update custom skills gitignore note

- [ ] **Step 1:** In the "Gitignore enforcement for skills" subsection, remove `!ship` from the correct example block:

  Current:

  ```gitignore
  # CORRECT — only custom/user-created skills are tracked
  /*/
  !agents-md
  !ship
  ```

  New:

  ```gitignore
  # CORRECT — only custom/user-created skills are tracked
  /*/
  !agents-md
  !commit
  ```

### 5c: Update the Skills directory structure

- [ ] **Step 1:** Remove `ship/` from the skills directory tree and update the `.gitignore` comment. Also add the new `.agents/` folder structure to the Architecture section:

  In the Skills directory structure block, remove:

  ```
  ├── ship/                   # Feature shipping skill (custom, git-tracked)
  ```

  Update `.gitignore` comment from:

  ```
  ├── .gitignore              # Ignores all folders; add !<name> to track custom skills
  ```

  to reflect that only `agents-md` and `commit` are tracked.

### 5d: Update Skill enforcement rules

- [ ] **Step 1:** Remove rule #8 (Shipping features → ship/SKILL.md) entirely.

  Current rule 8:

  ```
  8. **Shipping features** → Read `ship/SKILL.md`. Follow the full workflow: present roadmap, plan, implement, post-action loop.
  ```

  This rule is removed. Renumber subsequent rules if needed.

- [ ] **Step 2:** Add the full superpowers workflow chain as the new primary development workflow in the enforcement rules. After the last existing rule, add:

  ```markdown
  **Superpowers workflow chain (replaces ship):**

  | Trigger                            | Skills to invoke                  |
  | ---------------------------------- | --------------------------------- |
  | Start of every session             | `using-superpowers` — MANDATORY   |
  | Any new feature or creative work   | `brainstorming` → `writing-plans` |
  | Executing a plan (background)      | `executing-plans`                 |
  | Executing a plan (current session) | `subagent-driven-development`     |
  | Independent parallel tasks         | `dispatching-parallel-agents`     |
  | Feature work requiring isolation   | `using-git-worktrees`             |
  | Any new feature (before code)      | `test-driven-development`         |
  | Any bug or unexpected behavior     | `systematic-debugging`            |
  | After completing a feature         | `requesting-code-review`          |
  | Receiving review feedback          | `receiving-code-review`           |
  | Ready to integrate                 | `finishing-a-development-branch`  |
  | Before claiming work is done       | `verification-before-completion`  |
  | Committing changes                 | `commit`                          |
  ```

### 5e: Add superpowers location overrides

- [ ] **Step 1:** In the "Agent Skills" section (Setup subsection or a new subsection), add a "Location overrides" block that tells agents where to save superpowers output for this project, overriding the defaults:

  ```markdown
  ### Location overrides

  The superpowers skills use default output locations that are overridden for this project:

  | Output type                          | Default (superpowers)     | This project                 |
  | ------------------------------------ | ------------------------- | ---------------------------- |
  | Feature design specs (brainstorming) | `docs/superpowers/specs/` | `.agents/specs/`             |
  | Implementation plans (writing-plans) | `docs/superpowers/plans/` | `.agents/plans/`             |
  | App specification (permanent)        | n/a                       | `.agents/specs/app-spec.md`  |
  | Decisions log (permanent)            | n/a                       | `.agents/specs/decisions.md` |
  ```

### 5f: Update Architecture section

- [ ] **Step 1:** Add `.agents/` to the Architecture tree (currently the tree starts at `src/`). Add it as a top-level entry:

  ```
  .agents/
  ├── assets/             # Shared agent assets (certificate template PDF)
  ├── plans/              # Implementation plans (gitignored individually, dir tracked)
  ├── skills/             # Agent skills (.gitignored except agents-md, commit)
  └── specs/              # Permanent project docs (app-spec.md, decisions.md)
  ```

### 5g: Update gotcha #17 (certificate template path)

- [ ] **Step 1:** Update the certificate template path reference in gotcha #17:

  Current:

  ```
  The official template is at `.agents/skills/ship/assets/certificate-template.pdf`.
  ```

  New:

  ```
  The official template is at `.agents/assets/certificate-template.pdf`.
  ```

### 5h: Update contextual spec/roadmap references

- [ ] **Step 1:** Search AGENTS.md for any remaining references to `ship/references/` or `ship/SKILL.md` and remove or update them.

- [ ] **Step 2:** In the AGENTS.md auto-update section, update the "How to update" block for spec.md references to point to `.agents/specs/app-spec.md` instead of the ship references path.

---

## Task 6: Update root `.gitignore` for new `.agents/` structure

**Files:**

- Modify: `.gitignore` (if needed)

- [ ] **Step 1:** Check if `.gitignore` has any rules affecting `.agents/`:

  ```bash
  grep -n "\.agents" .gitignore
  ```

- [ ] **Step 2:** If `.agents/plans/` individual plan files should be gitignored (but the directory tracked), add:
  ```
  # Agent plans (session artifacts)
  .agents/plans/*.md
  ```
  Keep `.agents/specs/` and `.agents/assets/` fully tracked.

---

## Task 7: Run check and commit

- [ ] **Step 1:** Run the project check (will not catch docs-only changes but verifies nothing was broken):

  ```bash
  pnpm run check
  ```

  Expected: exit code 0.

- [ ] **Step 2:** Stage all changes:

  ```bash
  git add .agents/ AGENTS.md .gitignore
  git status
  ```

- [ ] **Step 3:** Commit using the commit skill:
      Read `.agents/skills/commit/SKILL.md` and execute the full commit workflow.

  Suggested message:

  ```
  chore(dev): migrate from ship skill to superpowers workflow

  - Create .agents/specs/ with app-spec.md and decisions.md
  - Move certificate template to .agents/assets/
  - Remove ship from git tracking (.agents/skills/.gitignore)
  - Update AGENTS.md: replace ship workflow with full superpowers chain
  - Add .agents/ directory structure to architecture docs
  - Override superpowers default output locations to .agents/

  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```

- [ ] **Step 4:** Verify clean working tree:
  ```bash
  git status
  ```
  Expected: "nothing to commit, working tree clean".
