# Remove Ship Skill and Optimize Agent Configuration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully excise the `ship` skill and all references to it, document the new superpowers workflow as the single entry point for development, add a commit discipline rule, and slim AGENTS.md for token efficiency.

**Architecture:** Six sequential tasks — delete the dead skill, remove all its references from AGENTS.md (9 targeted edits), add the commit discipline rule, optimize heavy reference sections in AGENTS.md, verify, and commit with a single commit.

**Tech Stack:** File edits only — no code changes, no dependency changes.

---

## Files Modified

- Delete: `.agents/skills/ship/SKILL.md`
- Modify: `.agents/skills/.gitignore` — remove `!/ship/` line
- Modify: `AGENTS.md` — 9 targeted removals/replacements + 1 new rule + optimization trims
- Modify: `AGENTS.md` — token-efficiency trims (stack table, lint table, env vars, hooks, utils)

---

## Task 1: Delete ship skill

**Files:**

- Delete: `.agents/skills/ship/SKILL.md` (and the directory)
- Modify: `.agents/skills/.gitignore`

- [ ] **Step 1: Remove the ship skill directory**

  Run:

  ```bash
  git rm -r .agents/skills/ship/
  ```

- [ ] **Step 2: Remove `!/ship/` from `.agents/skills/.gitignore`**

  Current `.agents/skills/.gitignore`:

  ```gitignore
  /*/
  !/agents-md/
  !/commit/
  !/release/
  !/ship/
  ```

  Replace with:

  ```gitignore
  /*/
  !/agents-md/
  !/commit/
  !/release/
  ```

- [ ] **Verify:** `ls .agents/skills/ship` returns "No such file or directory"; `.agents/skills/.gitignore` no longer contains `!/ship/`

---

## Task 2: Remove ship references from AGENTS.md — Installed Skills table

**Files:**

- Modify: `AGENTS.md`

There are 9 ship references spread across the Agent Skills section (installed skills table, workflow skills section, enforcement rules, directory tree). Work through them in document order.

### 2a — Remove the `ship` row from the installed skills table

- [ ] **Step 1: Delete the `ship` row**

  Find and remove this exact row from the installed skills table:

  ```
  | `ship`                                | custom                        | **PRIMARY ORCHESTRATOR** — execute tasks, scan codebase, manage roadmap; requires passing `pnpm run build` before task completion | **ALWAYS** when starting any development work (`/ship`)                                                                             |
  ```

### 2b — Update the `release` row (remove ship clause)

- [ ] **Step 1: Remove "or when ship triggers a release gate"**

  Find:

  ```
  | When cutting a release (`/release`) or when ship triggers a release gate
  ```

  Replace with:

  ```
  | When cutting a release (`/release`)
  ```

### 2c — Rename the Workflow Skills section and update its intro

- [ ] **Step 1: Rename the section heading**

  Find:

  ```
  ### Workflow Skills (used by ship)
  ```

  Replace with:

  ```
  ### Superpowers Workflow Skills
  ```

- [ ] **Step 2: Replace the intro paragraph**

  Find:

  ```
  Ship automatically invokes these skills at the right moments. You do not need to invoke them separately.
  ```

  Replace with:

  ```
  These skills define the full superpowers development workflow. Invoke them at the right phase — they are not invoked automatically.
  ```

### 2d — Rename the table column header

- [ ] **Step 1: Rename "When ship invokes it"**

  Find:

  ```
  | When ship invokes it
  ```

  Replace with:

  ```
  | When to invoke
  ```

### 2e — Update the `using-superpowers` row

- [ ] **Step 1: Remove the ship clause from the When column**

  Find:

  ```
  | Available for reference; ship embeds the relevant behaviors directly           |
  ```

  Replace with:

  ```
  | When orienting to the superpowers system or onboarding to the workflow         |
  ```

### 2f — Update enforcement rule 10 (release skill)

- [ ] **Step 1: Remove "Ship delegates to this skill at its release gate"**

  Find:

  ```
  10. **Releasing versions** → Read `release/SKILL.md`. Follow the release workflow for version bumps, changelog generation, and GitHub releases. Ship delegates to this skill at its release gate.
  ```

  Replace with:

  ```
  10. **Releasing versions** → Read `release/SKILL.md`. Follow the release workflow for version bumps, changelog generation, and GitHub releases.
  ```

### 2g — Replace enforcement rule 11 with new workflow rule

- [ ] **Step 1: Replace the old `/ship` rule with the new superpowers workflow rule**

  Find:

  ```
  11. **All development work** → Use `/ship` as the only entry point. Ship orchestrates all workflow skills (brainstorming, TDD, systematic debugging, parallel subagents, etc.) at the right moments. You do not need to invoke them separately.
  ```

  Replace with:

  ```
  11. **All development work** → Follow the superpowers workflow: `brainstorming` for design (saves spec to `.agents/specs/`) → `writing-plans` for complex tasks (saves plan to `.agents/plans/`) → `dispatching-parallel-agents` (preferred for independent sub-tasks) or `executing-plans` (sequential execution). Invoke each skill manually at the appropriate phase.
  ```

### 2h — Remove `ship/` from the skills directory tree

- [ ] **Step 1: Delete the ship line from the directory tree**

  Find:

  ```
      ├── ship/                                 # Primary orchestrator skill (custom, git-tracked)
  ```

  Remove this line entirely.

- [ ] **Verify:** `grep -n "ship" AGENTS.md` — the only remaining matches should be false positives (words containing "ship" as a substring such as "membership", "workshop", "ownership"). Zero matches for the standalone word `/ship`, `ship skill`, or `ship orchestrat`.

---

## Task 3: Add commit discipline rule

**Files:**

- Modify: `AGENTS.md` — Commands section (near the pre-commit validation block)

The rule belongs near the git hooks paragraph since that's where commit behavior is documented.

- [ ] **Step 1: Add the commit discipline rule**

  Find the existing pre-commit validation paragraph ending with:

  ```
  > **MANDATORY:** Always use `pnpm run <script>` (never bare `pnpm <script>`) to avoid conflicts with built-in pnpm commands (e.g. `pnpm ci`, `pnpm install`, `pnpm build`). The only exception is `pnpm install` itself.
  ```

  Insert after it (separated by a blank line):

  ```
  **Commit discipline:** Make one commit per logical task or feature. Never split a single task into a sequence of partial commits (e.g. `feat: add form` then `feat: add validation` then `feat: add error handling` — this is WRONG). Stage all changes for the task and commit once with a message that covers the full scope of work.
  ```

- [ ] **Verify:** `grep -n "Commit discipline" AGENTS.md` returns one match in the Commands section.

---

## Task 4: Optimize AGENTS.md for token efficiency

**Files:**

- Modify: `AGENTS.md` — targeted trims across 5 sections

The goal is to keep behavior-driving content (rules, patterns, conventions) and trim or compress pure reference content that agents can look up in source files. Do NOT remove anything that affects how code is written or how agents make decisions.

### 4a — Remove version column from Stack table

The exact dependency versions change with every bump. Agents don't need them to write code — `package.json` is authoritative. Remove the `Version` column from the Stack table.

- [ ] **Step 1: Change the header row**

  Find:

  ```
  | Category         | Technology                                            | Version            |
  | ---------------- | ----------------------------------------------------- | ------------------ |
  ```

  Replace with:

  ```
  | Category         | Technology                                                   |
  | ---------------- | ------------------------------------------------------------ |
  ```

- [ ] **Step 2:** For each row in the Stack table, remove the trailing `| ^x.y.z` column. There are ~18 rows. Edit each one to drop the third column. The resulting table has two columns: Category and Technology.

  For example:
  - `| Framework        | Next.js (App Router, RSC, Cached Components)          | ^16.1.7            |` becomes `| Framework        | Next.js (App Router, RSC, Cached Components)         |`
  - `| Language         | TypeScript (strict mode)                              | ^5.9.3             |` becomes `| Language         | TypeScript (strict mode)                             |`
  - (continue for all ~18 rows)

### 4b — Trim lint rules table to high-signal entries only

The full 20+ row lint table is rarely consulted by agents in context. Keep only the rules that constrain code style in non-obvious ways; drop rules that are standard TypeScript conventions. Agents can always check `.oxlintrc.json` for the full list.

- [ ] **Step 1: Replace the full lint rules table**

  Keep these high-signal rules (unusual, project-specific, or commonly violated):

  | Rule                                     | Setting                                      |
  | ---------------------------------------- | -------------------------------------------- |
  | `unicorn/no-array-for-each`              | Error — use `for..of`, `map`, `reduce`       |
  | `unicorn/no-for-loop`                    | Error — use `for..of`                        |
  | `eslint/arrow-body-style`                | Error — concise arrow body (`as-needed`)     |
  | `eslint/no-else-return`                  | Error — use early returns                    |
  | `eslint/no-console`                      | Warn — only `info`, `error`, `warn` allowed  |
  | `eslint/no-restricted-imports`           | Error — `../**` parent imports blocked       |
  | `import/no-relative-parent-imports`      | Error — use `@/` or `~/` path aliases        |
  | `import/consistent-type-specifier-style` | Error — inline type imports                  |
  | `import/no-cycle`                        | Error                                        |
  | `typescript/consistent-type-definitions` | Error — prefer `interface`                   |
  | `typescript/array-type`                  | Error — shorthand (`T[]`)                    |
  | `typescript/no-explicit-any`             | Warn (only `src/lib/types.ts` may use `any`) |
  | `unicorn/filename-case`                  | Error — kebab-case                           |
  | `react/jsx-fragments`                    | Error — syntax fragments (`<>`) only         |
  | `promise/prefer-await-to-then`           | Error — use `await` over `.then()`           |

  Drop these rows (standard TS/ESLint conventions, not project-specific):
  - `eslint/require-await`
  - `eslint/prefer-const`
  - `eslint/prefer-template`
  - `eslint/prefer-arrow-callback`
  - `import/no-namespace` (keep as footnote in lint overrides — it's relevant)
  - `import/no-commonjs`
  - `typescript/consistent-type-imports`
  - `typescript/no-inferrable-types`
  - `react/jsx-no-constructed-context-values`
  - `react/self-closing-comp`

### 4c — Remove the env vars Validation schema table

The Validation schema table (~20 rows) in the Environment Variables section duplicates what is in `src/lib/env.ts`. Agents don't need to read it inline — they can check the source file. Keep only the top-level variables table (Purpose / Scope / In env.ts columns) and a one-line reference.

- [ ] **Step 1: Replace the Validation schema section**

  Find the `### Validation schema (src/lib/env.ts)` heading and its content (the intro paragraph + the full table + the Build-time/Runtime validation paragraphs).

  Replace the entire `### Validation schema` section with a single reference line appended below the variables table:

  ```
  > See `src/lib/env.ts` for the full Zod validation schema, regex validators, and build-time/runtime validation logic.
  ```

  Keep the **Build-time validation** and **Runtime validation** paragraphs — they describe important call-site behavior and cannot be inferred from `env.ts` alone. Place the Zod reference line before those paragraphs.

### 4d — Trim Custom Hooks table descriptions to one-liners

The Custom Hooks table has verbose multi-sentence "Key behavior" descriptions. Trim to one line each. Agents can read the hook source for full details.

- [ ] **Step 1:** For each hook, reduce the "Key behavior" cell to one sentence. Examples:

  | Hook              | Trim to                                                                                                      |
  | ----------------- | ------------------------------------------------------------------------------------------------------------ |
  | `useComposedRefs` | Compose multiple refs into one; handles React 19 cleanup refs                                                |
  | `useCookies`      | Browser-side typed cookie management via `document.cookie`                                                   |
  | `useFileUpload`   | UploadThing upload with progress tracking and error toasts                                                   |
  | `useSession`      | Access session context; throws outside provider; exposes `isOrgAdmin`, `isLearner`, `isTutor`, `isVolunteer` |
  | `useTheme`        | Extends next-themes with View Transitions API and cookie persistence                                         |

  Keep all other hooks as-is (they are already one-liners).

- [ ] **Verify after all 4a-4d steps:** `wc -l AGENTS.md` — target is below 900 lines (from ~1107). If still above, identify remaining dense tables and trim further.

---

## Task 5: Final verification

**Files:**

- Read-only — no edits

- [ ] **Step 1: Confirm ship is gone from AGENTS.md**

  Manually scan (or search) for the word "ship" in standalone form. Acceptable remaining matches: "membership", "workshop", "ownership", "flagship" (substrings). Zero standalone `/ship` or "ship skill" matches allowed.

- [ ] **Step 2: Confirm new workflow rule is present**

  Find `dispatching-parallel-agents` in AGENTS.md — must appear in enforcement rule 11 and in the superpowers workflow skills table.

- [ ] **Step 3: Confirm commit discipline rule is present**

  Find "Commit discipline" in AGENTS.md — must appear once in the Commands section.

- [ ] **Step 4: Confirm ship skill directory is gone**

  `ls .agents/skills/ship` must return an error.

- [ ] **Step 5: Confirm .gitignore is clean**

  `.agents/skills/.gitignore` must not contain `!/ship/`.

---

## Task 6: Commit

**Files:**

- Stage all changes for one commit

- [ ] **Step 1: Run full check**

  ```bash
  pnpm run check
  ```

  Must exit with code 0. If any errors, fix them before proceeding.

- [ ] **Step 2: Stage all changes**

  ```bash
  git add -A
  ```

- [ ] **Step 3: Commit with a single message covering all tasks**

  ```bash
  git commit -m "chore: remove ship skill and optimize agent configuration"
  ```
