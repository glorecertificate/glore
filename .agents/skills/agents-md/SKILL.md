---
name: agents-md
description: Update AGENTS.md with any request — add rules, sync with codebase changes, or perform major rewrites. Invoked via `/agents-md <instruction>`.
metadata:
  author: glore
  version: '1.0.0'
  argument-hint: <instruction>
---

# agents-md

A skill for updating `AGENTS.md` — the single source of truth for all agent conventions, patterns, and architecture in this codebase.

## When to use

- `/agents-md add <rule>` — Add a specific rule, enforcement, pattern, or convention
- `/agents-md remove <rule>` — Remove a specific rule or section
- `/agents-md update` — Sync AGENTS.md with the current codebase (scan files, configs, routes, etc.)
- `/agents-md update <context>` — Major update after a migration, refactor, or architectural change

## Workflow

Follow these steps **in order** for every invocation:

### Step 1 — Classify the request

Determine the operation type:

| Type       | Trigger                                          | Scope                          |
| ---------- | ------------------------------------------------ | ------------------------------ |
| **add**    | User wants to add a rule, pattern, or convention | Targeted — one or few sections |
| **remove** | User wants to remove a rule or section           | Targeted — one or few sections |
| **update** | Sync with codebase or apply a major change       | Broad — many or all sections   |

### Step 2 — Read AGENTS.md

Always read `AGENTS.md` **in full** before making any changes. Understand the current structure, sections, and formatting conventions.

The file has these top-level sections (## headings):

1. Commands
2. Stack
3. Agent Skills
4. Architecture
5. Routing
6. Authentication Flow
7. Data Fetching
8. Internationalization
9. Component Patterns
10. Code Style
11. Type System
12. Utility Functions
13. Custom Hooks
14. Theming & Styling
15. Form Patterns
16. Email Templates
17. Environment Variables
18. Static Data
19. Constants Reference
20. Error Handling
21. Gotchas & Critical Behaviors
22. Coding Patterns (ENFORCED)
23. Temporary Files
24. Auto Updates
25. Common Patterns Quick Reference

### Step 3 — Gather context (if needed)

**For `add` / `remove`:** Only read relevant source files if the change requires verification (e.g., confirming a pattern exists before documenting it).

**For `update`:** Scan the codebase to detect changes. What to check depends on the context:

- **Generic `update`** (no specific context): Scan broadly — `package.json` scripts, config files, source structure, route files, schema files, linter/formatter configs, hooks, utils, actions, etc. Compare findings against current AGENTS.md content.
- **Contextual `update`** (e.g., "following migration from X to Y"): Focus on the affected areas. Read relevant source files, configs, and dependencies to understand what changed.

Key files to inspect for a broad update:

| What to check      | Files / patterns                                         |
| ------------------ | -------------------------------------------------------- |
| Commands & scripts | `package.json` → `scripts`                               |
| Stack & versions   | `package.json` → `dependencies` + `devDependencies`      |
| Architecture tree  | `src/` directory structure                               |
| Routes             | `src/app/` pages and layouts, `next.config.ts` redirects |
| API routes         | `src/app/api/` route files                               |
| Auth flow          | `src/proxy.ts`, `src/lib/auth/`                          |
| Database schema    | `src/db/schema/`, `src/db/queries/`, `src/db/types.ts`   |
| Cache tags         | `src/lib/cache.ts`                                       |
| Server actions     | `src/actions/*.ts`                                       |
| Hooks              | `src/hooks/*.ts`                                         |
| Utils              | `src/lib/utils.ts`                                       |
| Constants          | `src/lib/constants.ts`                                   |
| Components         | `src/components/` structure                              |
| Providers          | `src/components/providers/`                              |
| i18n               | `config/i18n.json`, `src/lib/i18n.ts`, `messages/`       |
| Linter rules       | `.oxlintrc.json`                                         |
| Formatter config   | `.oxfmtrc.json`                                          |
| Type system        | `tsconfig.json`, `src/lib/types.ts`, `src/db/types.ts`   |
| Env vars           | `env.d.ts`                                               |
| Email templates    | `src/email/templates/`                                   |
| Static config      | `config/*.json`                                          |
| Agent skills       | `.agents/skills/`, `skills-lock.json`                    |
| Theme              | `config/theme.json`, `src/app/globals.css`               |

### Step 4 — Plan changes

Before editing, list exactly which sections need changes and what the change is. Keep changes minimal and precise:

- **add**: Identify the correct section. If no section fits, add to the most relevant one or create a new subsection.
- **remove**: Identify the exact content to remove. Consider whether removal affects other sections.
- **update**: List all sections that are stale, missing, or incorrect. Prioritize accuracy over completeness — only change what's actually different.

### Step 5 — Apply edits

Edit `AGENTS.md` directly. Follow these formatting rules **strictly**:

1. **Preserve existing structure** — same heading levels, table formats, code block styles
2. **Match surrounding style** — if adjacent entries use `|` tables, use tables. If they use bullet lists, use bullets.
3. **Keep entries sorted** — alphabetical within tables, logical ordering within lists
4. **No orphaned references** — if you add something referenced elsewhere (e.g., a new hook), update all related sections
5. **Be precise** — change only what's needed. Don't rewrite paragraphs for a one-word fix.
6. **Use the right section** — rules about what code to write go in "Coding Patterns (ENFORCED)". Linter/formatter config goes in "Code Style". Architecture info goes in "Architecture". When in doubt:

| Content type               | Section                         |
| -------------------------- | ------------------------------- |
| Must-follow coding rules   | Coding Patterns (ENFORCED)      |
| Linter/formatter settings  | Code Style                      |
| Project structure          | Architecture                    |
| URL paths & guards         | Routing                         |
| Data access patterns       | Data Fetching                   |
| New hooks                  | Custom Hooks                    |
| New utilities              | Utility Functions               |
| Gotchas & footguns         | Gotchas & Critical Behaviors    |
| New env vars               | Environment Variables           |
| Quick copy-paste templates | Common Patterns Quick Reference |

### Step 6 — Verify

After editing, verify the changes:

1. Read the modified sections to confirm correctness
2. Check that no formatting is broken (tables aligned, code blocks closed, headings consistent)
3. If the change references code, confirm the code actually exists in the codebase

## Rules

1. **Never remove content without explicit instruction** — `/agents-md update` syncs and adds but does not remove unless something is provably gone from the codebase
2. **Never add comments to code examples** — code blocks in AGENTS.md follow the project's no-comments rule
3. **Preserve the MANDATORY banners** — the top-level banner and section-level `> **MANDATORY:**` callouts must stay
4. **Keep AGENTS.md self-contained** — don't reference external files for rules (skills are the exception)
5. **Tables must be pipe-aligned** — use consistent column widths matching the existing style
6. **Code examples must follow project conventions** — const arrows, no explicit return types, no `function` keyword, early returns, single quotes, no semicolons
7. **Cross-reference sections** — if a new Gotcha relates to a Coding Pattern, mention both
8. **Test your understanding** — for `update`, identify at least 3 concrete differences before editing. If you can't find any, report "AGENTS.md is up to date" and don't edit.

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
// ✅ Correct
useEffect(() => { ... }, [alpha, beta, gamma])

// ❌ Wrong — unordered
useEffect(() => { ... }, [gamma, alpha, beta])
\```
````

### Adding to "Code Style"

Only add entries backed by linter/formatter configuration. If the rule is an oxlint rule, add a row to the "Key lint rules" table. If it's a convention without tooling enforcement, it belongs in "Coding Patterns (ENFORCED)" instead.

### Adding to "Gotchas & Critical Behaviors"

Use the existing numbered-list format. New gotchas are appended at the end with the next number.

### Adding to "Custom Hooks" or "Utility Functions"

Add a row to the existing table, maintaining alphabetical sort order by name.

### Adding to "Stack"

Update the version from `package.json`. If adding a new technology, place it in the correct category row position.

### Updating "Architecture"

The tree must reflect the actual `src/` directory structure. Use `list_dir` to verify.
