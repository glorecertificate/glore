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

You must download and activate the Node.js version specified in [`.node-version`](.node-version).

### Setup and run

```sh
# Clone the repo
git clone https://github.com/glorecertificate/glore.git && cd glore

# Set up the environment
cp .env.example .env

# Enable pnpm and install dependencies
corepack enable && corepack install && pnpm install

# Install agent skills
pnpm skills

# Start the dev server on http://localhost:3030
pnpm dev

# Start the email preview server on http://localhost:3031
pnpm email
```

### Deployment

The app is currently hosted on [Vercel](https://vercel.com):

- Preview deployments are created automatically on every push to main with the [CI workflow](https://github.com/glorecertificate/glore/actions/workflows/ci.yml)
- Production deployments are triggered by a release with the [Release worflow](https://github.com/glorecertificate/glore/actions/workflows/release.yml)

The application can also be deployed manually:

```sh
pnpm run deploy       # deploy a preview
pnpm run deploy:prod  # deploy to production without a release
pnpm run release      # release + trigger production deploy
```

## Contributing

### Issues

Issues are used for bug reports, feature requests, and maintenance tasks. If you want to contribute, please [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) using one of the templates and describe the problem or feature you want to implement.

### Pull Requests

All commits must follow the [Conventional Commits](https://conventionalcommits.org) format, which is enforced by commitlint and Husky on commit and push:

```
<type>(<scope>): <description>
```

To open a pull request:

1. Fork the repository, create a new branch and implement your changes
2. [Open a pull request](https://github.com/glorecertificate/glore/compare) using the default template
3. Make sure all CI checks pass and wait for the maintainers to review your PR

## AI and agents

All coding conventions and architecture details are in [`AGENTS.md`](AGENTS.md). Every AI agent working on this codebase must read it before starting to work on any task.

The project uses the MCP servers configured in [`.mcp.json`](.mcp.json) and different agent skills to provide specific knowledge for database, auth, UI, emails, and more.

Use the `pnpm skills` command to install the skills locally and run them with Claude or any other compatible agent.

## License

<!-- add copyright symbol -->

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
