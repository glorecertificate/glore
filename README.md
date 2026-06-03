<div align="center">
  <h1><img src="public/logo.png" alt="" height="80"></h1>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/deploy"><img src="https://github.com/glorecertificate/glore/actions/workflows/deploy.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/release.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/release.yml/badge.svg" /></a>
</div>
<br>

**GloRe** is a multilingual e-learning platform that helps volunteers get their soft skills officially recognized. Visit [elearning.glorecertificate.net](https://elearning.glorecertificate.net) to sign up and get the certificate recognizing your skills.

## About

GloRe is a project developed by [Associazione Joint](https://associazionejoint.org), a non-profit organization founded in 2003 that supports youth mobility and international volunteering through Erasmus+ and the European Solidarity Corps.

## Development

This project is a multi-language Next.js 16 application written in TypeScript, using a Postgres database (Neon) with Drizzle and Better Auth, Tailwind CSS and shadcn/ui for styling, and other tools for services like email and translations.

### Prerequisites

- Node.js version specified in [`.node-version`](.node-version)
- Docker (for the local Postgres used in development)

### Setup and run

```sh
git clone https://github.com/glorecertificate/glore.git && cd glore
cp .env.example .env
corepack enable && corepack install && pnpm install
pnpm skills
pnpm run db:up
DATABASE_URL='postgresql://glore:glore@localhost:5433/glore' pnpm run db migrate
pnpm dev                # https://glore.localhost
pnpm email              # https://glore-email.localhost (optional)
```

### Local database

Development uses a Postgres 17 container managed by [`compose.yaml`](compose.yaml). The dev server
reads `DATABASE_URL` from `.env.development.local`, which Next.js loads only for `next dev` and
overrides `.env` / `.env.local`. Production builds (`next build`, Vercel) ignore that file and use
the Neon URL from `.env`. The driver in [`src/db/client.ts`](src/db/client.ts) selects `pg` for any
`localhost`/`127.0.0.1` host and `neon-http` for everything else.

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
pnpm run db:down    # stop and remove the container (volume preserved)
pnpm run db:logs    # tail Postgres logs
pnpm run db:reset   # drop the data volume and restart with an empty database
```

**Schema:**

`drizzle-kit` does not auto-load `.env.development.local`, so always pass `DATABASE_URL` explicitly when
operating on the local DB:

```sh
DATABASE_URL='postgresql://glore:glore@localhost:5433/glore' pnpm run db migrate    # apply pending migrations
DATABASE_URL='postgresql://glore:glore@localhost:5433/glore' pnpm run db generate   # generate a new migration from schema changes
DATABASE_URL='postgresql://glore:glore@localhost:5433/glore' pnpm run db studio     # open Drizzle Studio
```

**Seeding data from Neon:**

`pnpm run db:pull [env-file]` dumps the database referenced in the given env file (defaults to `.env`)
and replaces the local database with it. The script prints both source and target URLs (with passwords
masked) and asks for confirmation before running. It uses `pg_dump --clean --if-exists` inside the
`glore-postgres` container, so existing tables, rows, and types in the target are dropped.

```sh
pnpm run db:pull               # pull from the DATABASE_URL in .env
pnpm run db:pull .env.local    # pull from a different env file
```

The Postgres container must be running first (`pnpm run db:up`).

**Switching back to Neon in dev:**

Comment out the `DATABASE_URL` line in `.env.development.local`. Next.js will then fall through to
`.env.local` / `.env` on the next dev server restart.

### Deployment

The app is hosted on [Vercel](https://vercel.com):

- Preview deployments are created automatically on every push to `main` using the [CI workflow](https://github.com/glorecertificate/glore/actions/workflows/ci.yml)
- Production deployments are triggered by the [Release worflow](https://github.com/glorecertificate/glore/actions/workflows/release.yml)

The application can be also deployed manually:

```sh
pnpm run deploy       # deploy a preview
pnpm run deploy:prod  # deploy to production without a release
pnpm run release      # release + trigger production deploy
```

## Contributing

### Issues

Issues are used for bug reports, feature requests, and maintenance tasks. If you want to contribute, please [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) using one of the templates and describe the problem or feature you want to implement.

### Pull Requests

All commits must follow the Conventional Commits specification, which is enforced by commitlint on commit and push:

```
<type>(<scope>): <description>
```

To open a pull request:

1. Fork the repository, create a new branch and implement your changes
2. [Open a pull request](https://github.com/glorecertificate/glore/compare) using the default template
3. Make sure all CI checks pass and wait for a maintainer to review your PR

## AI and agents

All coding conventions and architecture details are documented in [`AGENTS.md`](AGENTS.md). Every AI agent working on this codebase must read it before starting to work on any task.

The project uses the MCP servers configured in [`.mcp.json`](.mcp.json) and different agent skills to provide specific knowledge for database, auth, UI, emails, and more.

Use the `pnpm skills` command to install the skills locally and run them with Claude or any other compatible agent.

## License

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
