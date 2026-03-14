---
name: commit
description: 'Finalize and commit the code for the current feature branch. This should be the last step before merging to main.'
---

# Commit Skill

Finalize and commit staged changes using conventional commits.

---

## Workflow

### 1. Check for changes

Run `git status` to check for uncommitted changes. If the working tree is clean (no changes), abort and inform the user.

### 2. Stage all changes

Run `git add -A` to stage all modified, added, and deleted files.

### 3. Inspect the diff

Run `git diff --cached --stat` to get a summary of what was staged. Use this to determine the appropriate commit type and scope.

### 4. Compose the commit message

Use the format below, following the rules in the next section.

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

### 5. Commit

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
| `ai`       | AI-generated or AI-assisted changes         |

### Scopes

Scope is **required**. Pick the most relevant one based on the changed files:

| Scope      | When to use                                          |
| ---------- | ---------------------------------------------------- |
| `deps`     | Production dependency changes (`dependencies`)       |
| `deps-dev` | Dev dependency changes (`devDependencies`)           |
| `release`  | Release-related files (changelog, version bumps)     |
| `security` | Security fixes or hardening                          |
| `mcp`      | MCP server or tool configuration                     |
| `skills`   | Agent skill files under `.agents/skills/`            |
| `agents`   | Agent configuration files (`AGENTS.md`, `CLAUDE.md`) |

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

---

## Examples

Simple commit without scope:

```
feat: Add public certificate page
```

Commit with scope and body:

```
feat(skills): Add commit skill

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
