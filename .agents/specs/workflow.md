# Agent workflow reference

Commands, skills, MCP, committing, and verification procedures. `AGENTS.md` keeps the hard rules; this file holds their detail.

## Commands

Always `pnpm run <script>`, never bare `pnpm <script>`, so nothing collides with a built-in pnpm command.

Exceptions: `pnpm install`, and the README's bare shorthand for human readers.

| Command                 | Description                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm run dev`          | Dev server at `https://glore.localhost` (portless, port 45673)                            |
| `pnpm run dev:clean`    | Wipe `.next`, then start dev (reclaims Turbopack disk)                                    |
| `pnpm run check`        | Parallel `check:types` (tsc), `check:lint` (oxlint), `check:format` (oxfmt), `check:knip` |
| `pnpm run test`         | Vitest unit tests (`src/**/*.test.ts`, `scripts/**/*.test.ts`)                            |
| `pnpm run test:e2e`     | Playwright e2e against the running dev server, logged in as seeded users                  |
| `pnpm run build`        | Production build                                                                          |
| `pnpm run typegen`      | Generate route and public-file types into `types/`                                        |
| `pnpm run db <command>` | drizzle-kit (`migrate`, `generate`, `studio`, ...)                                        |
| `pnpm run db:up`        | Local Postgres in Docker on port 5433 (used by `next dev`)                                |
| `pnpm run db:reset`     | Wipe and recreate the local Postgres volume                                               |
| `pnpm run db:seed`      | Upsert one test user per role into the local DB (refuses non-local URLs)                  |
| `pnpm run db:seed:demo` | Demo accounts on `TEST_EMAIL` plus-addresses (`--target local` or `staging`)              |
| `pnpm run mail:up`      | Local Mailpit inbox: SMTP on 1025, UI and API at `http://localhost:8025`                  |
| `pnpm run email`        | Preview email templates at `https://email.glore.localhost`                                |
| `pnpm run skills`       | Reinstall agent skills from `skills-lock.json`                                            |

## Seeds

- `pnpm run db:seed` (`scripts/seed.mts`) upserts the org `glore-seed` and one user per role at `<role>@seed.glore.test`: `admin` (platform admin), `editor`, `owner` (org admin), `representative`, `tutor`, `volunteer`, `learner`, plus `holder` (a volunteer for demo certificates, which tests that wipe `volunteer` leave alone) and `recovery` (password reset spec). The shared password and roles live in `scripts/seed-data.ts`. It runs in one transaction, is idempotent, and exits non-zero unless `DATABASE_URL` points to localhost.
- `pnpm run db:seed:demo --target <local|staging>` (`scripts/seed-demo.mts`) upserts the demo organizations and the accounts of `.agents/references/manual-testing.md` at `<local>+glore-<key>@<domain>` of `TEST_EMAIL`, with usernames `demo.<key>`. Data lives in `scripts/seed-demo-data.ts`; shared upserts in `scripts/seed-db.mts`.
- Guard: `local` needs a localhost `DATABASE_URL`; `staging` needs a remote one whose database comment is `glore:staging` (`COMMENT ON DATABASE`, set on the Neon `staging` branch only, since Neon forbids custom database settings). Production never has the setting, so it is never seeded.

## Committing

- Commit only when the current prompt asks for it.
- `pnpm run check` MUST exit 0 first, no exceptions.
- One logical task is one commit; never split a task into partial commits.
- Use Conventional Commits with a lower-case subject (commitlint rejects sentence case) and a header of at most 100 characters.
- Allowed scopes: `release`, `deps`, `deps-dev`, `security`.
- Hook mechanics (lefthook pre-commit, commit-msg, pre-push): `code.md`.

## Skills

- Third-party skills are vendored and tracked in `.agents/skills/`; `.claude/skills` symlinks to it, so read them through `.agents/skills/`.
- Never hand-edit a vendored skill; only `pnpm run skills` (the `skills` CLI) updates its files and `skills-lock.json`.
- `pnpm run skills` pulls each source's default branch, so a run meant to restore one skill can rewrite every tracked skill.
- After a run, review the `.agents/skills/` and `skills-lock.json` diff as a code change.
- Then `git restore` and `git clean` any skill you did not mean to update.
- `web-design-guidelines` fetches its rules at runtime from `vercel-labs/web-interface-guidelines` on `main`, so it can change with no lockfile change.
- `agent-browser`, `sync-i18n`, `sync-docs`, and `sync-agents` are machine-wide skills invoked by name, not vendored here.

| Working on                       | Read / run                                                           |
| -------------------------------- | -------------------------------------------------------------------- |
| Any React or Next.js code        | `vercel-react-best-practices` (apply CRITICAL > HIGH > MEDIUM > LOW) |
| Next.js APIs and config          | `node_modules/next/dist/docs/` (version-exact, see `reference.md`)   |
| UI and visual review             | `vercel-react-best-practices` + `web-design-guidelines`              |
| Driving or verifying the real UI | `agent-browser`                                                      |
| shadcn/ui components             | `shadcn`                                                             |
| Database and schema              | `neon-drizzle`                                                       |
| Email (`src/emails/`)            | `react-email`                                                        |
| Cloudflare                       | `cloudflare`                                                         |
| Translations (`messages/`)       | `sync-i18n`                                                          |
| Docs (README, `.agents/`)        | `sync-docs`, or `sync-agents` for agentic files                      |

## MCP and Claude settings

- `.mcp.json` declares `cloudflare` (R2 and Workers docs) and `neon` (database ops); `.claude/settings.json` enables both.
- Tracked `.claude/settings.json` allowlists the check and test scripts and denies local env reads.
- Its PostToolUse hook runs oxfmt on edited code, JSON, CSS, Markdown, and YAML files.
- Put personal overrides in `.claude/settings.local.json`.

## Email verification

Email flows (auth, invite, certificate, account) are tested autonomously, never handed to the user.

1. Run `pnpm run mail:up`.
2. Confirm delivery with `pnpm run test:e2e -- e2e/recovery.spec.ts`. It fails when no mail reaches Mailpit, usually because `.env.local` lacks `MAIL_TRANSPORT=mailpit`.
3. When that variable is missing, ask the user to set it. Env files are unreadable to agents, and dev otherwise sends real SMTP email.
4. Drive the flow, then read the message and its links from `http://localhost:8025/api/v1/search?query=to:"<email>"`.

## Docs sync

- Docs sync triggers: a change to routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or structure.
- On a trigger, update `AGENTS.md`, `README.md`, and the matching spec in the same change, without asking.
- Edit `AGENTS.md` directly, never `CLAUDE.md`, which only imports it.
- Inventories the code already enumerates (hook lists, env var tables, cache tags) stay in the code with a pointer here, not copied.

## Testing

- `pnpm run test` runs Vitest in the Node environment over `src/**/*.test.ts` and `scripts/**/*.test.ts`. `vitest.config.ts` resolves tsconfig paths and aliases `server-only` to an empty module, so server actions import cleanly; mock `@/actions/auth` and `next/cache` per test. It loads `.env` and `.env.local`, so DB-backed tests (for example `src/db/mutations/certificate.test.ts`) run against the local DB and skip themselves when `DATABASE_URL` is not local; the certificate suites build their own org and users with `src/actions/certificates/test-harness.ts`.
- `pnpm run test:e2e` runs Playwright (`e2e/`) against the dev server at `E2E_BASE_URL` (default `https://glore.localhost`). The `setup` project logs in every `AUTH_ROLES` seed user and stores their state in `.playwright/.auth/`; specs pick one with `test.use({ storageState: authFile(role) })`. Better Auth limits sign-ins, so add a role to `AUTH_ROLES` instead of logging in inside specs. `e2e/mail.ts` reads Mailpit (`MAILPIT_URL`), and `recovery.spec.ts` resets the `recovery` seed user's password through the emailed link (`db:seed` restores it). Setup clears local `rate_limits` first. `e2e.yml` starts Postgres and Mailpit services, migrates, seeds, runs `next build`, then Playwright's `webServer` runs `next start` on port 3000. Workflows: `ci.yml` (push) runs `check.yml` (`check` and `test`) and `e2e.yml`, then preview `deploy.yml` after both pass; `release.yml` deploys production after `check.yml` only.

## Browser verification

- Drive the running dev server at `https://glore.localhost` with the machine-wide `agent-browser` skill; never start a second app stack or preview server.
- Reuse Playwright auth state (`--state .playwright/.auth/<role>.json --ignore-https-errors`) to act as a seeded user.
- Close each named session in the turn that finishes with it; an orphan holds about 900MB of Chrome.
- `APP_URL` must match the driven host, since `allowedDevOrigins` and Better Auth `baseURL` derive from it.
