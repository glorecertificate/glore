<div align="center">
  <h1><img src="public/logo.png" alt="" height="80"></h1>
  <img src="https://img.shields.io/github/package-json/v/glorecertificate/glore?labelColor=%2339414a&color=%2352b6cb">
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/release.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/release.yml/badge.svg" /></a>
</div>
<br>

**GloRe** is a multilingual e-learning platform that helps volunteers get their soft skills officially recognized. Visit [elearning.glorecertificate.net](https://elearning.glorecertificate.net) to sign up and get the certificate recognizing your skills.

## About

GloRe is a project developed by [Associazione Joint](https://associazionejoint.org), a non-profit organization founded in 2003 that supports youth mobility and international volunteering through Erasmus+ and the European Solidarity Corps.

## Development

This project is a multi-language Next.js 16 application written in TypeScript, using a Postgres database (Neon) with Drizzle and Better Auth, Cloudflare R2 for file storage, Tailwind CSS and shadcn/ui for styling, and other tools for services like email and translations.

Shared UI components live in `src/components/ui/`. The release kit includes accessible data tables, statistics, timelines, skill levels, clipboard and QR controls, segmented controls, avatar stacks, and the certificate arrow motif. Charts load Recharts on demand and include a data table for screen readers. Component conventions are in [the UI reference](.agents/specs/ui.md#release-ui-kit).

### Prerequisites

- Node.js version specified in [`.node-version`](.node-version)
- Docker (for the local Postgres and Mailpit used in development)

### Setup and run

```sh
git clone https://github.com/glorecertificate/glore.git && cd glore
cp .env.example .env
echo DATABASE_URL=postgresql://glore:glore@localhost:5433/glore > .env.local
echo MAIL_TRANSPORT=mailpit >> .env.local  # deliver emails to the local Mailpit inbox
corepack enable && corepack install
pnpm install
pnpm run skills
pnpm run db:up
pnpm run mail:up  # Mailpit inbox at http://localhost:8025
pnpm run db migrate
pnpm run db:seed  # one test user per role, password in scripts/seed-data.ts
pnpm run dev      # https://glore.localhost
pnpm run email    # https://email.glore.localhost
```

The app validates its environment on start against the schema in [`next.config.ts`](next.config.ts), which lists every variable it reads.

### Local database

Development uses a Postgres 17 container managed by [`compose.yaml`](compose.yaml), next to a Mailpit container for outgoing emails. The dev server reads `DATABASE_URL` from `.env.local`, which Next.js loads for every command (`next dev`, `next build`, `next typegen`, `next start`) and which overrides `.env`. Use `.env.local` for machine-local values and `.env` for values shared by every environment; on Vercel the injected project variables always win, since Next never overwrites a variable already present in `process.env`. The driver in [`src/db/client.ts`](src/db/client.ts) selects `pg` for any `localhost` or `127.0.0.1` host and `neon-http` for everything else.

**Connection (local):**

| Field    | Value                                            |
| -------- | ------------------------------------------------ |
| Host     | `localhost`                                      |
| Port     | `5433` (5432 is reserved to avoid host conflict) |
| Database | `glore`                                          |
| User     | `glore`                                          |
| Password | `glore`                                          |
| URL      | `postgresql://glore:glore@localhost:5433/glore`  |

**Container lifecycle:**

```sh
pnpm run db:up      # start (or recreate) the Postgres container
pnpm run db:down    # stop and remove the containers (volume preserved)
pnpm run db:logs    # tail Postgres logs
pnpm run db:reset   # drop the data volume and restart with an empty database
pnpm run db:seed    # upsert the seed organization and its test users, one per role (local database only)
pnpm run db:seed:demo --target local  # full demo dataset on TEST_EMAIL plus-addresses
```

The demo seed reads `TEST_EMAIL` from `.env.local` and needs the course catalog, so run `pnpm run content:import --target local` first.

**Schema:**

The `db` script wraps `drizzle-kit` and reads `DATABASE_URL` from `.env.local` to target the local container automatically:

```sh
pnpm run db migrate    # apply pending migrations
pnpm run db generate   # generate a new migration from schema changes
pnpm run db studio     # open Drizzle Studio
```

To run against a different database, prefix the command with an explicit `DATABASE_URL=...`.

**Tests:**

```sh
pnpm run test       # Vitest unit tests
pnpm run test:e2e   # Playwright against the running dev server, as seeded users
```

The e2e suite needs `pnpm run dev` running and a database seeded with `pnpm run db:seed`. The recovery spec reads its email from Mailpit, so run `pnpm run mail:up` and set `MAIL_TRANSPORT=mailpit` first. CI runs the same suite against a production build, with Postgres and Mailpit as service containers ([`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)).

**Switching back to Neon in dev:**

Comment out the `DATABASE_URL` line in `.env.local`. Next.js will then fall through to `.env` on the next dev server restart. When a file defines the same variable twice, the last occurrence wins, so keep one active block and comment out the rest.

### Deployment

The app is hosted on [Vercel](https://vercel.com):

- The [CI workflow](https://github.com/glorecertificate/glore/actions/workflows/ci.yml) deploys a preview on every push and pull request to `main`, once the checks and e2e tests pass. Vercel's own Git deployments are disabled for `main`
- The [Release workflow](https://github.com/glorecertificate/glore/actions/workflows/release.yml) deploys to production when a `v*` tag is pushed

The application can also be deployed manually:

```sh
pnpm run deploy:preview     # deploy a preview
pnpm run deploy:production  # deploy to production without a release
pnpm run release            # check, build, bump the version, update CHANGELOG.md, tag and push from main
```

Pushing the release tag triggers the production deployment.

## Contributing

### Issues

Issues are used for bug reports, feature requests, maintenance tasks, and specs for coding agents. If you want to contribute, please [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) using one of the templates and describe the problem or feature you want to implement.

### Pull requests

All commits must follow the Conventional Commits specification, which is enforced by commitlint on commit and push:

```
<type>(<scope>): <description>
```

The scope is optional and limited to `release`, `deps`, `deps-dev`, and `security`. The header can be at most 100 characters long.

To open a pull request:

1. Fork the repository, create a new branch and implement your changes
2. Run `pnpm run check` and `pnpm run test` locally and make sure they pass (`check` covers types, lint, format, unused code, and translations; the pre-push hook runs the first four)
3. [Open a pull request](https://github.com/glorecertificate/glore/compare) using the default template
4. Make sure all CI checks pass and wait for a maintainer to review your PR

### Translations

`en` is the source language. UI messages (`messages/en.json`) and legal texts (`content/legal/*.en.md`) are translated into Spanish and Italian through [Crowdin](https://crowdin.com), configured in [`crowdin.yml`](crowdin.yml). Crowdin opens pull requests from `l10n_*` branches; review them like code and squash merge once `pnpm run check` passes. `pnpm run check:i18n` verifies that every locale has the same keys, ICU placeholders, and tags as `en`.

## AI and agents

All coding conventions and architecture details are documented in [`AGENTS.md`](AGENTS.md). Every AI agent working on this codebase must read it before starting to work on any task.

The project uses the MCP servers configured in [`.mcp.json`](.mcp.json) and different agent skills to provide specific knowledge for database, auth, UI, emails, and more.

Use the `pnpm run skills` command to install the skills locally and run them with Claude or any other compatible agent.

## License

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
