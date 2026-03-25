---
name: release
description: >
  Create a versioned release with changelog generation, version bumping, tagging, and GitHub release.
  Presents a preview of what will be released (commits and changelog), waits for explicit user
  confirmation, then executes the release. Use when the user says /release, "make a release",
  "cut a release", "publish a new version", "bump the version", or wants to ship a versioned release.
  This skill handles the full release-it workflow for this project.
argument-hint: patch | minor | major
---

# Release

Execute a controlled release: preview what will ship, get confirmation, then publish.

This project uses `release-it` with conventional changelog and version bumping. The release command is `pnpm run release`, which wraps `dotenv release-it --`. The config lives in `.release-it.json`.

---

## Workflow

### 1. Preflight checks

Before anything else, verify the environment is ready for a release:

a. **Branch check.** Run `git branch --show-current`. The release MUST happen on `main`. If not on `main`, inform the user and stop.

b. **Clean working directory.** Run `git status --porcelain`. If there are uncommitted changes, inform the user. Offer to commit them first using the commit skill (`/commit`). Do not proceed with a dirty working tree.

c. **Up to date with remote.** Run `git fetch origin main && git diff HEAD origin/main --stat`. If there are differences, inform the user that local and remote are out of sync and let them decide how to proceed.

### 2. Collect new commits and determine increment

If the user provided an increment as an argument (e.g., `/release minor`, `/release patch`, `/release major`), that increment MUST be used exactly as specified. Skip the commit analysis below and go straight to step 3 with the given increment.

If no increment was specified, gather all commits since the last release tag:

```bash
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline --no-decorate
```

If there are no new commits since the last tag, inform the user there is nothing to release and stop.

Analyze the commits to determine the appropriate semver increment:

- **major**: commits contain a breaking change (`BREAKING CHANGE` in body/footer, or `!` after type/scope)
- **minor**: commits contain at least one `feat` type
- **patch**: only `fix`, `chore`, `docs`, `refactor`, `style`, `perf`, `test`, `ci`, `build`, or similar non-feature types

The agent decides the increment. This decision drives the rest of the workflow.

### 3. Generate changelog preview

Run the release-it changelog preview:

```bash
pnpm run release --changelog
```

This is a dry-run that outputs the changelog diff (what would be appended to CHANGELOG.md) without making any changes. Capture the output.

The changelog preview prints a version header (e.g., `## [0.5.1]`). Compare this version with the one implied by the agent's chosen increment. If they differ (e.g., the changelog says `0.5.1` but the agent determined `minor` which would produce `0.6.0`), the agent's increment takes precedence. In the release summary, show the corrected version, not the one from the changelog output.

### 4. Present the release summary

Format and present a clear release preview to the user:

```
🚀 Release preview (vX.Y.Z → vA.B.C, <increment> release)

Commits since last release (vX.Y.Z):
  <short-hash> <commit message>
  <short-hash> <commit message>
  ...

Changelog preview:
  <formatted changelog output with the corrected version header>

Type "release" to proceed, or provide feedback.
```

The version shown in the summary and changelog preview MUST reflect the agent's chosen increment, not the raw `--changelog` output. Render the changelog as clean markdown (section headers, bullet lists) matching the existing CHANGELOG.md format. Do not dump raw terminal output.

### 5. Wait for confirmation

This is a hard gate. Do NOT proceed without explicit user confirmation.

- **User types `release`**: proceed to step 6.
- **User gives feedback or a different instruction**: respond accordingly. The user can ask questions, request changes, or abandon the release. If they want to continue after making changes, they can invoke `/release` again.

### 6. Execute the release

Run the release with the determined increment:

```bash
pnpm run release --increment <increment>
```

Where `<increment>` is `major`, `minor`, or `patch` as determined in step 2.

This command:

- Bumps the version according to the specified increment
- Updates the version in `config/metadata.json` (via `@release-it/bumper`)
- Prepends the changelog entry to `CHANGELOG.md` (via `@release-it/conventional-changelog`)
- Runs `pnpm run format && git add .` (pre-release hook)
- Creates a git commit (`chore(release): vX.Y.Z`)
- Creates a git tag (`vX.Y.Z`)
- Pushes the commit and tag to origin
- Creates a GitHub release (`vX.Y.Z`)

### 7. Report the result

After the command completes successfully, report:

- The new version number
- The git tag created
- The GitHub release URL (format: `https://github.com/glorecertificate/glore/releases/tag/vX.Y.Z`)

If the command fails, show the full error output and ask the user how to proceed. Do not retry automatically.
