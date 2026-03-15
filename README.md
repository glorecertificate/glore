<div align="center">
  <h1><img src="public/logo.png" alt="" height="80"></h1>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/deploy.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/deploy.yml/badge.svg" /></a>
</div>
<br>

**GloRe** is a multilingual e-learning platform that helps volunteers get their soft skills officially recognized. Visit [elearning.glorecertificate.net](https://elearning.glorecertificate.net) to sign up and get the certificate recognizing your skills.

## About

GloRe is a project developed by [Associazione Joint](https://associazionejoint.org), a non-profit organization founded in 2003 that supports youth mobility and international volunteering through Erasmus+ and the European Solidarity Corps.

## Development

This project is a multi-language Next.js 16 application written in TypeScript, using a Postgres database (Neon) with Drizzle and Better Auth, Tailwind CSS with shadcn/ui, and other tools for services like email and translations.

### Prerequisites

You must download and activate the Node.js version specified in [`.node-version`](.node-version).

### Setup

```sh
# Clone the repo
git clone https://github.com/glorecertificate/glore.git && cd glore

# Set up environment variables
cp .env.example .env

# Enable pnpm and install dependencies
corepack enable && corepack install && pnpm install

# Install agent skills
pnpm skills

# Start the dev server on http://localhost:3030
pnpm dev

# Start the mail server on http://localhost:3031
pnpm email
```

### Deployment

The app is hosted on Vercel. Preview deployments are created automatically on every push.

```sh
pnpm deploy:preview  # manual preview
pnpm deploy:prod     # deploy to production without a release
pnpm release         # interactive release + tag, triggers production deploy
```

## Contributing

### Issues

Issues are used for bug reports, feature requests, and maintenance tasks. If you want to contribute, you can [open an issue](https://github.com/glorecertificate/glore/issues/new/choose) using one of the templates and describe the problem or the feature you want to implement.

### Pull Requests

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org) format enforced by commitlint and Husky on commit and push:

```
<type>(<scope>): Sentence case subject
```

To open a pull request:

1. Branch off `main` and implement your changes
2. [Open a pull request](https://github.com/glorecertificate/glore/compare) using the default template
3. The CI checks must pass and a collaborator review is required

## AI and agents

All coding conventions and architecture details are in [`AGENTS.md`](AGENTS.md). Every AI agent working on this codebase must read it before starting.

The project uses MCP servers (configured in [`.mcp.json`](.mcp.json)) and agent skills to provide specific knowledge for database, auth, UI, and email.

Planning files like `SPEC.md` and `ROADMAP.md` are excluded from version control and shared among collaborators separately.

## License

Copyright 2025-present Associazione Joint <info@associazionejoint.org>
