---
name: commit
description: Finalize and commit the code for the current feature branch. This should be the last step before merging to main.
---

# Commit Skill

Finalize and commit staged changes using conventional commits.

---

## Workflow

### 1. Validate — MANDATORY gate

Run `pnpm run check` (or `pnpm run check:ci` for speed). **This MUST exit with code 0 before any commit is made.** If any TypeScript, lint, format, or unused-export errors are reported, stop immediately, fix every error, and re-run the check until it passes cleanly. Do not proceed to the next step while errors remain. There are no exceptions.

### 2. Check for changes

Run `git status` to check for uncommitted changes. If the working tree is clean (no changes), abort and inform the user.

### 3. Stage all changes

Run `git add -A` to stage all modified, added, and deleted files.

### 4. Inspect the diff

Run `git diff --cached --stat` to get a summary of what was staged. Use this to determine the appropriate commit type and scope.

### 5. Compose the commit message

Use the format below, following the rules in the next section.

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

### 6. Commit

Run `git commit -m "<message>"` with the composed message.

---

## Commit message rules

### Types

Pick exactly one type based on the nature of the change:

| Type       | When to use                                 |
| ---------- | ------------------------------------------- |
| `feat`     | New feature or user-facing functionality    |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation only                          |
| `style`    | Formatting, whitespace, no logic change     |
| `refactor` | Code restructuring without behavior change  |
| `perf`     | Performance improvement                     |
| `test`     | Adding or updating tests                    |
| `build`    | Build system or external dependency changes |
| `ci`       | CI/CD configuration changes                 |
| `chore`    | Maintenance tasks, tooling, config          |
| `revert`   | Reverts a previous commit                   |

### Scopes

Scope is **not required**. Pick the most relevant one based on the changed files only if necessary:

| Scope      | When to use                                      |
| ---------- | ------------------------------------------------ |
| `deps`     | Production dependency changes (`dependencies`)   |
| `deps-dev` | Dev dependency changes (`devDependencies`)       |
| `release`  | Release-related files (changelog, version bumps) |
| `security` | Security fixes or hardening                      |

If none of the scopes apply, **omit the scope** (e.g. `feat: Add public certificate page`).

### Subject

- Sentence-case (first word capitalized, rest lowercase unless proper nouns)
- Imperative mood, present tense: "Add feature" not "Added feature" or "Adds feature"
- No trailing period
- Maximum 100 characters for the full header line

### Body (optional)

- Include only when the change warrants additional context
- Must be a bullet list using `-`
- Maximum **5 bullet points**
- Each point in neutral/imperative format: "Fix the bug", not "Fixed" or "Fixes"
- Separated from the subject by a blank line

### Footer (optional)

- Use for breaking changes (`BREAKING CHANGE: <description>`) or issue references (`Closes #123`)
- Maximum 120 characters per line
- Separated from the body (or subject if no body) by a blank line
- **NEVER add a `Co-authored-by:` trailer** — do not attribute the commit to any AI agent, Copilot, or automated tool under any circumstances

---

## Examples

Simple commit without scope:

```
feat: Add public certificate page
```

Commit with scope and body:

```
docs: Add commit skill

- Define workflow for staging and committing changes
- Document conventional commit types and scopes
- Add subject, body, and footer formatting rules
```

Commit with breaking change footer:

```
refactor: Rename auth cookie prefix

- Update cookie prefix from `app_` to `gl_`
- Migrate existing session handling logic

BREAKING CHANGE: Existing sessions using the old prefix will be invalidated
```

Never add a co-author footer. The footer is only for breaking changes or issue references:

```
// WRONG — never add Co-authored-by
perf: Enable React Compiler and add Suspense boundaries

- Install babel-plugin-react-compiler and enable reactCompiler in next.config.ts

Co-authored-by: Copilot <copilot@github.com>
```

```
// CORRECT — no co-author trailer
perf: Enable React Compiler and add Suspense boundaries

- Install babel-plugin-react-compiler and enable reactCompiler in next.config.ts
```
