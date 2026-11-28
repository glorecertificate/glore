<div align="center">
  <h1><img src="public/logo.png" alt="GloRe Certificate" height="80"></h1>

[![](https://shieldcn.dev/github/release/glorecertificate/glore.svg?variant=secondary&size=xs&gradient=16304f,194064,1a5076,13607f,2a6f60,100)](https://github.com/glorecertificate/glore/releases/latest)
[![](https://shieldcn.dev/github/ci/glorecertificate/glore.svg?size=xs)](https://github.com/glorecertificate/glore/actions/workflows/ci.yml)
[![](https://shieldcn.dev/github/checks/glorecertificate/glore/main/Analyze%20%28javascript-typescript%29.svg?label=CodeQL&size=xs)](https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql)
[![](https://shieldcn.dev/github/license/glorecertificate/glore.svg?size=xs)](LICENSE)
</div>

**GloRe** is a multilingual e-learning platform that certifies soft skills gained through volunteering and international mobility.

Users can learn with interactive courses, request an official certificate from their organization, and share it with a public link that anyone can verify.

Visit [glorecertificate.xyz](https://glorecertificate.xyz) to log in or register your organization.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/images/hero-dark.webp">
  <img src=".github/images/hero-light.webp" alt="Dashboard of a volunteer, a sample soft skills certificate, and its public verification page on a phone">
</picture>

## Who it is for

| Role                  | Scope                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Volunteers            | Take courses on soft skills and request a certificate for their experiences |
| Tutors                | Review requests and confirm skill levels                                    |
| Organizations         | Invite volunteers, assign tutors, and issue certificates                    |
| Employers and schools | Verify a certificate with a public link                                     |

## Features

- Interactive courses on 25 soft skills, with lessons, quizzes, and final assessments.
- Official PDF certificates with a QR code and public sharing on LinkedIn and other social media.
- Interactive review queue for tutors, with comments and change requests.
- Course editor with AI writing and translation.
- A curated interface in English, Spanish, and Italian.

## About the project

GloRe is short for Global Recognition. Volunteers learn skills that traditional qualifications do not show, and employers and schools need proof that they can trust.

GloRe is a project of [Associazione Joint](https://associazionejoint.org), a non-profit organization founded in 2003. Joint supports youth mobility and international volunteering through Erasmus+ and the European Solidarity Corps.

## Quick start

GloRe is a Next.js application running Postgres with Drizzle ORM. See [tech stack](CONTRIBUTING.md#tech-stack) for the full list of technologies used in the project.

Requirements:

- Node.js 24. The exact version is in [`.node-version`](.node-version).
- pnpm via Corepack.
- Docker for the local Postgres and Mailpit containers.

First, clone the repository locally:

```sh
git clone https://github.com/glorecertificate/glore.git
```

Once in the repository, copy the environment file and set the database URL and mail transport in `.env.local`:

```sh
cp .env.example .env
echo DATABASE_URL=postgresql://glore:glore@localhost:5433/glore > .env.local
echo MAIL_TRANSPORT=mailpit >> .env.local
```

Enable Corepack, install the pinned pnpm version and the required dependencies:

```sh
corepack enable
corepack install
pnpm install
```

Start the database and mail containers:

```sh
pnpm run db:up
pnpm run mail:up  # inbox at http://localhost:8025
```

Once the database is up, run the migrations, import the courses, and seed the test users:

```sh
pnpm run db migrate
pnpm run content:import --target local
pnpm run db:seed
```

Finally, run the development server:

```sh
pnpm run dev
```

Open https://glore.localhost and log in as one of the seeded users. The password for all users is specified in [`scripts/seed-data.ts`](scripts/seed-data.ts).

See [development](CONTRIBUTING.md#development) for further information about the environment, the database, and the tests that can be run against the local server.

## Documentation

| Document                                 | Contents                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)     | Development, tests, translations, pull requests, deployment, and releases |
| [`content/README.md`](content/README.md) | Format of the courses, skill groups, and help articles                    |
| [`AGENTS.md`](AGENTS.md)                 | Coding conventions and architecture rules, for humans and coding agents   |
| [`.agents/specs/`](.agents/specs)        | Product and engineering specs                                             |
| [`CHANGELOG.md`](CHANGELOG.md)           | Changes in each release                                                   |

## Contributing

Contributions are welcome. To report a bug or suggest a feature, please [open an issue](https://github.com/glorecertificate/glore/issues/new/choose). Before making any changes to the code, we recommend reading the [contributing guide](CONTRIBUTING.md) first.

## License

Released under the [MIT License](LICENSE) by [Associazione Joint](https://associazionejoint.org).
