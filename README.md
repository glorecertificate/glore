<div align="center">
  <h1><img src="public/logo.png" alt="" height="80"></h1>
  <img src="https://img.shields.io/github/package-json/v/glorecertificate/glore?labelColor=%2339414a&color=%2352b6cb">
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/release.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/release.yml/badge.svg" /></a>
</div>
<br>

**GloRe** is a multilingual e-learning platform that certifies the soft skills people gain through volunteering. Volunteers learn with skill courses, request a certificate from their organization, and share it with a link that anyone can verify. Visit [glorecertificate.xyz](https://glorecertificate.xyz) to sign up.

- [About](#about)
- [Quick start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Translations](#translations)
- [AI and agents](#ai-and-agents)
- [License](#license)

## About

GloRe is a project of [Associazione Joint](https://associazionejoint.org), a non-profit organization founded in 2003. Joint supports youth mobility and international volunteering through Erasmus+ and the European Solidarity Corps.

The app is a Next.js 16 application in TypeScript with React 19. It uses these services and libraries:

- Postgres on [Neon](https://neon.com), with Drizzle ORM and Better Auth.
- Cloudflare R2 for uploaded files.
- Tailwind CSS 4 and shadcn/ui for the interface. The shared components are in `src/components/ui/`.
- React Email templates, sent through SMTP.
- Gemini, through the AI SDK, for AI writing and translation.

The interface is in English, Spanish, and Italian.

## Quick start

You need:

- Node.js 24. The exact version is in [`.node-version`](.node-version).
- pnpm, through Corepack. `package.json` pins the version.
- Docker, for the local Postgres and Mailpit containers.

```sh
git clone https://github.com/glorecertificate/glore.git && cd glore
cp .env.example .env
echo DATABASE_URL=postgresql://glore:glore@localhost:5433/glore > .env.local
echo MAIL_TRANSPORT=mailpit >> .env.local  # deliver emails to the local Mailpit inbox
corepack enable && corepack install
pnpm install
pnpm run db:up
pnpm run mail:up  # Mailpit inbox at http://localhost:8025
pnpm run db migrate
pnpm run db:seed  # one test user per role, password in scripts/seed-data.ts
pnpm run dev      # https://glore.localhost
```

Open `https://glore.localhost` and log in as one of the seeded users.

## Development

### Project layout

| Path              | Contents                                                   |
| ----------------- | ---------------------------------------------------------- |
| `src/app/`        | Next.js routes                                             |
| `src/components/` | The UI kit (`ui/`), the layout, and the feature components |
| `src/actions/`    | Server actions                                             |
| `src/db/`         | The Drizzle schema, queries, and mutations                 |
| `src/emails/`     | Email templates                                            |
| `messages/`       | Interface text in `en`, `es`, and `it`                     |
| `content/`        | Courses, skill groups, and help articles as files          |
| `scripts/`        | Seed, content, translation, QA, and release scripts        |
| `e2e/`            | Playwright tests                                           |
| `drizzle/`        | Generated migrations. Do not edit them.                    |
| `.agents/specs/`  | The product and engineering specs                          |

### Environment

The app checks its environment on start against the schema in [`next.config.ts`](next.config.ts). The schema lists every variable that the app reads. Only the demo seed reads `TEST_EMAIL`, outside the schema.

Next.js loads `.env.local` for every command (`next dev`, `next build`, `next typegen`, `next start`), and it overrides `.env`. Put machine-local values in `.env.local` and values shared by every environment in `.env`. On Vercel, the project variables always win, because Next.js never overwrites a variable that is already in `process.env`.

### Local database

Development uses a Postgres 17 container from [`compose.yaml`](compose.yaml), next to a Mailpit container for outgoing emails. The dev server reads `DATABASE_URL` from `.env.local`.

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Host     | `localhost`                                        |
| Port     | `5433` (not 5432, to avoid a conflict on the host) |
| Database | `glore`                                            |
| User     | `glore`                                            |
| Password | `glore`                                            |
| URL      | `postgresql://glore:glore@localhost:5433/glore`    |

[`src/db/client.ts`](src/db/client.ts) uses the `pg` driver for a `localhost` or `127.0.0.1` host. For any other host it uses Neon: `neon-http` for queries and a `neon-serverless` pool for transactions.

```sh
pnpm run db:up      # start (or recreate) the Postgres container
pnpm run db:down    # stop and remove the containers (the volume stays)
pnpm run db:logs    # follow the Postgres logs
pnpm run db:reset   # drop the data volume and restart with an empty database
pnpm run db:seed    # upsert the seed organization and its test users, one per role (local database only)
pnpm run db:seed:demo --target local  # full demo dataset on TEST_EMAIL plus-addresses
```

The demo seed reads `TEST_EMAIL` from `.env.local` and needs the course catalog. Run `pnpm run content:import --target local` first. `pnpm run content:levels --target <local|staging|production>` adds the missing skill level descriptions from `content/`, and it never overwrites edited text.

To use Neon in development, comment out the `DATABASE_URL` line in `.env.local` and restart the dev server. Next.js then reads the value from `.env`. When a file defines a variable twice, the last one wins, so keep one active block and comment out the rest.

### Schema and migrations

The `db` script runs `drizzle-kit`. It reads `DATABASE_URL` from `.env.local`, so it targets the local container:

```sh
pnpm run db migrate    # apply pending migrations
pnpm run db generate   # generate a new migration from schema changes
pnpm run db studio     # open Drizzle Studio
```

To use a different database, start the command with an explicit `DATABASE_URL=...`.

### Emails

Mailpit receives every email that the local app sends, in its inbox at `http://localhost:8025`. `pnpm run email` starts the React Email preview server at `https://email.glore.localhost`. Editors and admins can also preview every template, in each language, at `/emails` in the app.

### Content

Courses, skill groups, and help articles are Markdown and JSON files in `content/`. [`content/README.md`](content/README.md) describes the format, the checks of `pnpm run content:check`, and the import with `pnpm run content:import`.

### Tests

```sh
pnpm run test       # Vitest unit tests
pnpm run test:e2e   # Playwright against the running dev server, as seeded users
pnpm run test:perf  # load, navigation, and interaction timings against E2E_BASE_URL
pnpm run qa:atlas   # screenshots and axe results for each route and role
pnpm run qa:perf    # perf report against the targets in config/performance.json
```

The e2e suite needs `pnpm run dev` and a database seeded with `pnpm run db:seed`. The invitation and application specs read their emails from Mailpit, so run `pnpm run mail:up` and set `MAIL_TRANSPORT=mailpit` first. CI runs the same suite against a production build, with Postgres and Mailpit as service containers ([`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)).

The suite runs in Chromium by default. Set `E2E_BROWSERS=webkit,firefox` to run the smoke specs on a 390 px iPhone in WebKit and on desktop Firefox. Install the browsers first with `pnpm exec playwright install chromium webkit firefox`, because the login setup runs in Chromium. CI runs them every night ([`.github/workflows/browsers.yml`](.github/workflows/browsers.yml)).

The atlas uses the same dev server and seed. It logs in as each role, captures every page that the role can open, and runs axe on each page. It captures light and dark mode at 1440 and 390 pixels. It writes the screenshots, `report.json`, and an `index.html` contact sheet to `.playwright/atlas/<timestamp>/`. Add `--roles admin,guest` to limit the run.

The perf cases give comparable numbers only against a production server:

1. Build and start a server on port 3100 with `APP_URL=http://localhost:3100`.
2. Run `E2E_BASE_URL=http://localhost:3100 pnpm run test:perf`.
3. Run `pnpm run qa:perf` to write `.playwright/perf/report.md`.

Each case runs on a desktop profile and a throttled mobile profile. On each pull request, CI runs the cases on the head and the base commit on the same runner, and compares them ([`.github/workflows/perf.yml`](.github/workflows/perf.yml)). The targets and the procedure are in [`.agents/specs/performance.md`](.agents/specs/performance.md).

## Deployment

The app runs on [Vercel](https://vercel.com). Vercel's own Git deployments are off, so each commit deploys once, from GitHub Actions:

- The [CI workflow](https://github.com/glorecertificate/glore/actions/workflows/ci.yml) deploys a preview on each push to `main`, after the checks and the e2e tests pass. A pull request gets a preview only when it has the `preview` label.
- The preview of `main` is at [preview.glorecertificate.xyz](https://preview.glorecertificate.xyz). It is the staging environment.
- The [Release workflow](https://github.com/glorecertificate/glore/actions/workflows/release.yml) deploys to production when a `v*` tag is pushed. Production is at the `url` in [`config/metadata.json`](config/metadata.json).

A release takes two steps:

```sh
pnpm run release      # on a release/<version> branch: check, build, bump the version, update CHANGELOG.md, commit, and push
pnpm run release:tag  # after the release PR merges: tag main, push the tag, and create the GitHub release
```

The tag push starts the production deployment. You can also deploy by hand:

```sh
pnpm run deploy:preview     # deploy a preview
pnpm run deploy:production  # deploy to production without a release
```

The database stores each uploaded file with its full public URL. When the bucket moves to a new domain, `pnpm run files:rehost --from <old URL> --to <new URL>` lists the URLs to change, and `--apply` changes them. The release runbook has the steps (`.agents/references/release-runbook.md`, "File links").

## Contributing

### Issues

The issues hold bug reports, feature requests, maintenance tasks, and specs for coding agents. To contribute, [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) with one of the templates, and describe the problem or the feature.

### Pull requests

1. Fork the repository, create a branch, and make your changes.
2. Keep the branch free of merge commits. When it conflicts with `main`, rebase it. The Git hooks and CI reject merge commits.
3. Run `pnpm run check` and `pnpm run test`, and make sure that they pass.
4. [Open a pull request](https://github.com/glorecertificate/glore/compare) with the default template. Fill in each section with short, plain sentences. The maintainers write in [Simplified Technical English](https://www.asd-ste100.org/).
5. Make sure that all CI checks pass, then wait for a maintainer to review the pull request.

`pnpm run check` covers types, lint, format, unused code, translations, the generated theme files, the design-system lint ratchet, and the size budgets of `AGENTS.md` and the specs. The pre-push hook runs the first four.

Every commit follows [Conventional Commits](https://www.conventionalcommits.org/), and commitlint checks it on commit and on push:

```
<type>(<scope>): <description>
```

The scope is optional, and it can only be `release`, `deps`, `deps-dev`, or `security`. The header has at most 100 characters. A pull request merges as one squash commit, so write its title as a commit header.

## Translations

English is the source language. The interface text is in `messages/en.json`, with Spanish and Italian in `messages/es.json` and `messages/it.json`. Every new key needs a real translation in all three files. `pnpm run check:i18n` makes sure that every locale has the same keys, ICU placeholders, and tags as `en`.

Each editor in the app translates its own content: courses, lessons, help articles, skill groups, and legal texts. A Translate menu fills the open language tab with an AI translation from another language that has text. The result is an unsaved change, so the editor can review it before saving. Courses and help articles are published per language. The Translation gaps card on the editor dashboard shows what is missing in each language.

The legal texts have versions in the database, and editors change them at `/legal`. `content/legal` only seeds a new database.

Editors and admins can change any interface text at `/translations`, with no deploy. The page checks the ICU syntax and placeholders, shows a preview, keeps a history, and suggests `es` and `it` drafts with AI. Nothing goes live until someone publishes it.

Three scripts keep the message files in sync with these changes. `i18n:overrides` and `i18n:pull` take `--target local`, `staging`, or `production`, and they only read the database. `i18n:pull` also takes `--dry-run` and `--include-outdated`. `i18n:rename` changes only the message files.

```sh
pnpm run i18n:overrides --target staging  # count the overrides per locale and the stale ones
pnpm run i18n:pull --target staging       # write the published overrides into messages/*.json for a pull request
pnpm run i18n:rename Old.key New.key      # rename a key in every message file and print the SQL for its overrides
```

Admins edit the contact email, phone, website, social links, and legal entity at `/admin/settings`. These values show in emails, on the help page, and on the about page. `config/metadata.json` holds the defaults.

## AI and agents

[`AGENTS.md`](AGENTS.md) holds the coding conventions and the architecture rules. Every AI agent must read it before it starts a task. The specs in `.agents/specs/` hold the details.

The project uses the MCP servers in [`.mcp.json`](.mcp.json) and agent skills for the database, auth, the interface, emails, and more. Run `pnpm run skills` to install the skills for Claude or another compatible agent.

On GitHub, the Claude review check reviews each pull request. To start Claude on a task, mention `@claude` in an issue or pull request comment, or add the `agent` label to an issue.

## License

Released under the [MIT License](LICENSE).

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
