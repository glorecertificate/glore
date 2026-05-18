---
name: agents-md
description: Update AGENTS.md and .agents/specs/ files with any request — add rules, sync with codebase changes, or perform major rewrites. Invoked via `/agents-md <instruction>`.
metadata:
  version: '2.0.0'
  argument-hint: <instruction>
---

# agents-md

A skill for maintaining `AGENTS.md` and the `.agents/specs/` reference files — the single source of truth for all agent conventions, architecture, and codebase knowledge.

## When to use

- `/agents-md add <rule>` — Add a specific rule, enforcement, pattern, or convention
- `/agents-md remove <rule>` — Remove a specific rule or section
- `/agents-md update` — Sync with the current codebase (scan files, configs, routes, etc.)
- `/agents-md update <context>` — Targeted update after a migration, refactor, or architectural change

## File ownership

| File                              | Purpose                                                | Line limit  |
| --------------------------------- | ------------------------------------------------------ | ----------- |
| `AGENTS.md`                       | Entry point: commands, rules, gotchas, enforced coding patterns | 300 lines |
| `.agents/specs/app.md`            | Product specification and user roles                   | No limit    |
| `.agents/specs/architecture.md`   | Full `src/` tree, file naming, server/client rules     | No limit    |
| `.agents/specs/code.md`           | Formatter settings, import order, lint rules           | No limit    |
| `.agents/specs/reference.md`      | Routing, auth, data fetching, types, hooks, utils, env vars | No limit |
| `.agents/specs/decisions.md`      | Historical decisions log                               | No limit    |
| `.agents/specs/roadmap.md`        | Feature backlog and roadmap (P0-P3)                    | No limit    |
| `.agents/specs/skills.md`         | Installed skills tables, workflow skills               | No limit    |

**Where new content belongs:**

- Information agents need at the start of every task → `AGENTS.md`
- Deep technical detail needed only for specific work areas → the appropriate `.agents/specs/*.md` file
- If an edit would push `AGENTS.md` over 300 lines → move the detail to the appropriate spec file and add a summary line with a reference

## Workflow

Follow these steps **in order** for every invocation:

### Step 1 — Classify the request

| Type       | Trigger                                          | Scope                          |
| ---------- | ------------------------------------------------ | ------------------------------ |
| **add**    | User wants to add a rule, pattern, or convention | Targeted — one or few sections |
| **remove** | User wants to remove a rule or section           | Targeted — one or few sections |
| **update** | Sync with codebase or apply a major change       | Broad — many or all sections   |

### Step 2 — Read current files

Always read `AGENTS.md` **in full** before making any changes. For `update` operations, also read the affected `.agents/specs/*.md` files.

`AGENTS.md` has these top-level `##` sections:

1. Reference Specs
2. Next.js Docs
3. Commands
4. Model Selection
5. Stack
6. Agent Skills
7. Architecture
8. Code Style
9. Internationalization
10. Gotchas & Critical Behaviors
11. Coding Patterns (ENFORCED)
12. Temporary Files
13. Auto Updates

### Step 3 — Gather context (if needed)

**For `add` / `remove`:** Only read relevant source files if the change requires verification (e.g., confirming a pattern exists before documenting it).

**For `update`:** Scan the codebase to detect changes.

- **Generic `update`** (no specific context): Scan broadly — `package.json` scripts, config files, source structure, route files, schema files, linter/formatter configs, hooks, utils, actions, and all `.agents/specs/` files. Compare findings against current content.
- **Contextual `update`** (e.g., "following migration from X to Y"): Focus on the affected areas. Read relevant source files, configs, and dependencies.

Key files to inspect for a broad update:

| What to check      | Files / patterns                                         |
| ------------------ | -------------------------------------------------------- |
| Commands & scripts | `package.json` → `scripts`                               |
| Stack & versions   | `package.json` → `dependencies` + `devDependencies`      |
| Architecture tree  | `src/` directory structure                               |
| Routes             | `src/app/` pages and layouts, `next.config.ts` redirects |
| API routes         | `src/app/api/` route files                               |
| Auth flow          | `src/proxy.ts`, `src/lib/auth.ts`                        |
| Database schema    | `src/db/schema/`, `src/db/queries/`, `src/db/types.ts`   |
| Cache tags         | `src/lib/cache.ts`                                       |
| Server actions     | `src/actions/*.ts`                                       |
| Hooks              | `src/hooks/*.ts`                                         |
| Utils              | `src/lib/utils.ts`                                       |
| Constants          | `src/lib/constants.ts`                                   |
| Components         | `src/components/` structure                              |
| Providers          | `src/components/providers/`                              |
| i18n               | `config/i18n.json`, `src/lib/i18n.ts`, `messages/`       |
| Linter / formatter | `vite.config.ts`                                         |
| Type system        | `tsconfig.json`, `src/lib/types.ts`, `src/db/types.ts`   |
| Env vars           | `env.d.ts`, `src/lib/env.ts`                             |
| Email templates    | `src/emails/`                                            |
| Static config      | `config/*.json`                                          |
| Agent skills       | `.agents/skills/`, `skills-lock.json`                    |
| Theme              | `config/theme.json`, `src/app/globals.css`               |
| Spec files         | `.agents/specs/*.md`                                     |

### Step 4 — Decide: AGENTS.md or spec file?

Before planning edits, decide where the content belongs:

| Content type                                        | Target                                    |
| --------------------------------------------------- | ----------------------------------------- |
| Must-follow coding rules                            | `AGENTS.md` → Coding Patterns (ENFORCED)  |
| Critical footguns and gotchas                       | `AGENTS.md` → Gotchas & Critical Behaviors |
| Commands agents need to run                         | `AGENTS.md` → Commands                   |
| Stack technology list                               | `AGENTS.md` → Stack                      |
| Skill activation rules                              | `AGENTS.md` → Agent Skills               |
| Internationalization conventions                    | `AGENTS.md` → Internationalization       |
| Product spec, user roles, flows                     | `.agents/specs/app.md`                    |
| `src/` tree, file naming, server/client rules       | `.agents/specs/architecture.md`           |
| Formatter, lint, import rules                       | `.agents/specs/code.md`                   |
| Routes, auth, data fetching, env vars, hooks, utils | `.agents/specs/reference.md`              |
| Decisions log                                       | `.agents/specs/decisions.md`              |
| Roadmap / backlog                                   | `.agents/specs/roadmap.md`                |
| Installed skills, workflow skills                   | `.agents/specs/skills.md`                 |

### Step 5 — Plan changes

Before editing, list exactly which files and sections need changes. Keep changes minimal and precise:

- **add**: Identify the correct file and section. If no section fits, create a new subsection.
- **remove**: Identify the exact content to remove. Consider whether removal affects cross-references.
- **update**: List all content that is stale, missing, or incorrect. Prioritize accuracy — only change what's actually different.

### Step 6 — Apply edits

Edit files directly. Follow these formatting rules **strictly**:

1. **Preserve existing structure** — same heading levels, table formats, code block styles
2. **Match surrounding style** — if adjacent entries use `|` tables, use tables. If they use bullet lists, use bullets.
3. **Keep entries sorted** — alphabetical within tables, logical ordering within lists
4. **No orphaned references** — if you add something referenced elsewhere, update all related sections
5. **Be precise** — change only what's needed. Don't rewrite paragraphs for a one-word fix.
6. **AGENTS.md stays under 300 lines** — if your edit pushes it over, move content to the appropriate spec file

### Step 7 — Verify

After editing:

1. Read the modified sections to confirm correctness
2. Check that no formatting is broken (tables aligned, code blocks closed, headings consistent)
3. If the change references code, confirm the code actually exists in the codebase
4. Verify `AGENTS.md` line count stays under 300

## Rules

1. **Never remove content without explicit instruction** — `update` syncs and adds but does not remove unless something is provably gone from the codebase
2. **Never add comments to code examples** — code blocks follow the project's no-comments rule
3. **Preserve the MANDATORY banners** — the top-level banner and section-level `> **MANDATORY:**` callouts must stay
4. **AGENTS.md is for entry-point rules only** — deep technical detail belongs in `.agents/specs/`; reference it with a one-line summary
5. **Tables must be pipe-aligned** — use consistent column widths matching the existing style
6. **Code examples must follow project conventions** — const arrows, no explicit return types, no `function` keyword, early returns, single quotes, no semicolons
7. **Cross-reference sections** — if a new Gotcha relates to a Coding Pattern, mention both
8. **Test your understanding** — for `update`, identify at least 3 concrete differences before editing. If you can't find any, report "files are up to date" and don't edit.

## Section-specific guidance

### Adding to "Coding Patterns (ENFORCED)"

New enforced patterns must include:

- A `###` heading with the pattern name
- A brief **bolded rule statement**
- A `✅ Correct` and `❌ Wrong` code example pair (when applicable)
- Reference to any enforcing linter rule (if one exists)

Example:

````markdown
### Dependency array ordering

- **Order dependency arrays alphabetically** in React hooks (`useEffect`, `useMemo`, `useCallback`, `useLayoutEffect`):

\```typescript
useEffect(() => { ... }, [alpha, beta, gamma])
\```
````

### Adding to "Gotchas & Critical Behaviors"

Use the existing numbered-list format. New gotchas are appended at the end with the next number.

### Adding to "Stack"

Update the version from `package.json`. If adding a new technology, place it in the correct category row.

### Updating ".agents/specs/architecture.md"

The tree must reflect the actual `src/` directory structure. Use `list_dir` to verify before editing.

### Updating ".agents/specs/reference.md"

This file owns routing tables, auth flow, data fetching patterns, types, hooks, utils, theming, emails, and env vars. Update only the relevant section; don't touch unrelated sections.

### Updating ".agents/specs/decisions.md"

Append a new row to the log table with today's date, a concise decision title, and the rationale. Never edit existing rows.

### Updating ".agents/specs/roadmap.md"

Move completed items to the Done table. Add new items with the correct priority tier (P0-P3). Update the status symbol when work starts or finishes.
