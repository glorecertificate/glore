# Contributing to GloRe

To run the app on your machine, follow the [quick start](README.md#quick-start) first.

## Issues

Issues are used for bug reports, feature requests, maintenance tasks, and specs for coding agents. To contribute, [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) with one of the templates and describe the problem or feature.

## Pull requests

1. Fork the repository, create a branch and make your changes.
2. Keep the branch free of merge commits, which are rejected by the Git hooks and CI.
3. Make sure that `pnpm run check` and `pnpm run test` pass.
4. [Open a pull request](https://github.com/glorecertificate/glore/compare) with the default template. Fill in each section with short, plain sentences. The maintainers write in [Simplified Technical English](https://www.asd-ste100.org/).
5. Make sure that all CI checks pass, then wait for a maintainer to review the pull request.

`pnpm run check` covers types, lint, format, unused code, translations, and the generated theme files. The pre-push hook runs the first four.

## Commit messages

Every commit follows [Conventional Commits](https://www.conventionalcommits.org) and is checked by commitlint on commit and push:

```
<type>(<scope>): <description>
```

The scope is optional and can only be `release`, `deps`, `deps-dev`, or `security`. The header has at most 100 characters. A pull request merges as one squash commit, so write its title as a commit header.

## Development

### Tech stack

| Area           | Tools                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App            | [Next.js](https://nextjs.org), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Better Auth](https://better-auth.com), [next-intl](https://next-intl.dev) |
| Data           | Postgres on [Neon](https://neon.com), [Drizzle ORM](https://orm.drizzle.team), [Zod](https://zod.dev)                                                                               |
| Interface      | [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Plate](https://platejs.org)                                                                           |
| Emails and PDF | [React Email](https://react.email), [React PDF](https://react-pdf.org)                                                                                                              |
| AI             | [AI SDK](https://ai-sdk.dev) with Gemini models                                                                                                                                     |
| Services       | [Vercel](https://vercel.com), [Cloudflare R2](https://www.cloudflare.com/products/r2/)                                                                                              |
| Tests          | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev)                                                                                                                  |

### Project layout

| Path              | Contents                                        |
| ----------------- | ----------------------------------------------- |
| `src/app/`        | Next.js routes                                  |
| `src/components/` | UI kit, layout and feature components           |
| `src/actions/`    | Server actions                                  |
| `src/db/`         | Drizzle schema, queries and mutations           |
| `src/emails/`     | Email templates                                 |
| `messages/`       | Interface text in `en`, `es` and `it`           |
| `content/`        | Courses, skill groups and help articles         |
| `scripts/`        | Seed, content, translation, QA, release scripts |
| `e2e/`            | Playwright tests                                |
| `drizzle/`        | Generated migrations                            |
| `.agents/specs/`  | Product and engineering specs                   |

### Environment

The app checks the environment on start against the schema definition in [`next.config.ts`](next.config.ts).

Machine-local values must be placed in `.env.local`, values shared by every environment in `.env`.

### Local database

Development uses Postgres 17, and Mailpit for outgoing emails. The dev server reads `DATABASE_URL` from `.env.local`.

| Field    | Value                                           |
| -------- | ----------------------------------------------- |
| Host     | `localhost`                                     |
| Port     | `5433`                                          |
| Database | `glore`                                         |
| User     | `glore`                                         |
| Password | `glore`                                         |
| URL      | `postgresql://glore:glore@localhost:5433/glore` |

[`src/db/client.ts`](src/db/client.ts) uses the `pg` driver for a `localhost`/`127.0.0.1` host and Neon for any other host (`neon-http` for queries and `neon-serverless` for transactions).

```sh
pnpm run db:up      # start the Postgres container
pnpm run db:down    # stop and remove the containers
pnpm run db:logs    # follow the Postgres logs
pnpm run db:reset   # drop data volume and restart with empty database
```

To seed the database, run these commands in order:

```sh
pnpm run content:import --target local  # import the course catalog
pnpm run content:levels --target local  # add the missing skill level descriptions
pnpm run db:seed                        # seed organization and test users (one per role)
pnpm run db:seed:demo --target local    # full demo dataset
```

The demo seed is optional. Set `TEST_EMAIL` in `.env.local` first, because its users get plus-addresses of that inbox.

### Schema and migrations

The `db` script runs `drizzle-kit`, which reads `DATABASE_URL` from `.env.local`:

```sh
pnpm run db migrate    # apply pending migrations
pnpm run db generate   # generate new migration from schema changes
pnpm run db studio     # open Drizzle Studio
```

To use a different database, start the command with an explicit `DATABASE_URL=...`.

### Emails

Mailpit receives every email sent by the local app in the inbox at http://localhost:8025.

`pnpm run email` starts the React Email preview server at https://email.glore.localhost.

### Content

Courses, skill groups, and help articles are Markdown and JSON files in `content/`. [`content/README.md`](content/README.md) describes the format, the checks (`pnpm run content:check`) and the import (`pnpm run content:import`).

### Tests

```sh
pnpm run test       # Vitest unit tests
pnpm run test:e2e   # Playwright against running dev server
pnpm run test:perf  # load, navigation, interactions against E2E_BASE_URL
pnpm run qa:atlas   # screenshots and axe results for each route and role
pnpm run qa:perf    # perf report against the targets in config/performance.json
```

The e2e suite needs `pnpm run dev` and a database seeded with `pnpm run db:seed`. The invitation and application specs read their emails from Mailpit, so run `pnpm run mail:up` and set `MAIL_TRANSPORT=mailpit` first.

CI runs the same suite against a production build, with Postgres and Mailpit as service containers ([`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)).

The suite runs in Chromium by default. Set `E2E_BROWSERS=webkit,firefox` to run the smoke specs on a 390 px iPhone in WebKit and on desktop Firefox. Install the browsers first with `pnpm exec playwright install chromium webkit firefox`, because the login setup runs in Chromium. CI runs them every night ([`.github/workflows/browsers.yml`](.github/workflows/browsers.yml)).

The atlas uses the same dev server and seed. It logs in as each role, captures every page that the role can open, and runs axe on each page. It captures light and dark mode at 1440 and 390 pixels. It writes the screenshots, `report.json`, and an `index.html` contact sheet to `.playwright/atlas/<timestamp>/`. Add `--roles admin,guest` to limit the run.

The e2e suite also runs axe on the main pages of each role (`e2e/accessibility.spec.ts`). A serious or critical issue fails CI.

The perf cases give comparable numbers only against a production server:

1. Build and start a server on port 3100 with `APP_URL=http://localhost:3100`.
2. Run `E2E_BASE_URL=http://localhost:3100 pnpm run test:perf`.
3. Run `pnpm run qa:perf` to write `.playwright/perf/report.md`.

Each case runs on a desktop profile and a throttled mobile profile. On each pull request, CI runs the cases on the head and the base commit on the same runner, and compares them ([`.github/workflows/perf.yml`](.github/workflows/perf.yml)). The targets and the procedure are in [`.agents/specs/performance.md`](.agents/specs/performance.md).

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

## Deployment and releases

The app runs on [Vercel](https://vercel.com). Vercel's own Git deployments are off, so each commit deploys once, from GitHub Actions:

- The [CI workflow](https://github.com/glorecertificate/glore/actions/workflows/ci.yml) deploys each push to `main` to `qa`, after the checks and the e2e tests pass. A pull request gets a `qa` deploy only when it has the `preview` label.
- The [Promote workflow](https://github.com/glorecertificate/glore/actions/workflows/promote.yml) deploys a tested commit of `main` to [preview.glorecertificate.xyz](https://preview.glorecertificate.xyz). It runs only by hand.
- The [Release workflow](https://github.com/glorecertificate/glore/actions/workflows/release.yml) deploys to production when a `v*` tag is pushed, if that commit was promoted. Production is at the `url` in [`config/metadata.json`](config/metadata.json).

A release takes two commands. Between them, promote the release commit and check the preview:

```sh
pnpm run release      # on a release/<version> branch: check, build, bump the version, update CHANGELOG.md, commit, and push
pnpm run release:tag  # after the promotion: tag the release commit, push the tag, and create the GitHub release
```

The tag push starts the production deployment. You can also deploy by hand:

```sh
pnpm run deploy:preview     # deploy to a preview URL of the linked project
pnpm run deploy:production  # deploy to production without a release
```

The database stores each uploaded file with its full public URL. When the bucket moves to a new domain, `pnpm run files:rehost --from <old URL> --to <new URL>` lists the URLs to change. Add `--apply` to change them. The release runbook has the steps (`.agents/references/release-runbook.md`, "File links").

## AI and agents

[`AGENTS.md`](AGENTS.md) holds the coding conventions and the architecture rules. Every AI agent must read it before it starts a task. The specs in `.agents/specs/` hold the details.

The project uses the MCP servers in [`.mcp.json`](.mcp.json) and agent skills for the database, auth, the interface, emails, and more. Run `pnpm run skills` to install the skills for Claude or another compatible agent.

On GitHub, the Claude review check reviews each pull request. To start Claude on a task, mention `@claude` in an issue or pull request comment, or add the `agent` label to an issue.
