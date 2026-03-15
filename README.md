<div align="center">
  <h1><img src="public/icon.png" alt="" width="80"></h1>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/deploy.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/deploy.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
</div>
<br>

GloRe is an official certificate that verifies volunteering activities.

Visit our website to find out how to sign up to the [e-learning platform](https://elearning.glorecertificate.net) and get the certificate recognizing your soft skills.

## About

GloRe is a single-package <a href="https://nextjs.org">Next.js</a> application backed by <a href="https://neon.tech">Neon</a> Serverless Postgres, <a href="https://orm.drizzle.team">Drizzle ORM</a>, and different utility packages.

The project uses <a href="https://tailwindcss.com">Tailwind CSS</a> and <a href="https://ui.shadcn.com">shadcn/ui</a> components for building user interfaces.

## Development

### Prerequisites

You must download and activate the Node.js version specified [here](.node-version).

### Setup

Download the project using the GitHub client or Git:

```sh
gh repo clone glorecertificate/glore
# or
git clone https://github.com/glorecertificate/glore.git
```

Switch to the project directory, copy the example env file and fill in the required values to gain access to the services used throughout the project:

```sh
cd glore
cp .env.example .env
```

### Running the application

Activate pnpm using Corepack and install the project dependencies:

```sh
corepack enable
corepack install
pnpm install
```

Run a development server with:

```bash
pnpm dev
```

This command will start the Next.js application and the mail development server. By default, you can access the application at [http://localhost:3030](http://localhost:3030) and the mail server at [http://localhost:3031](http://localhost:3031).

## Deployment

The application is hosted on [Vercel](https://vercel.com).

To deploy it, you must set up a Vercel account and create a new project specifying the required environment variables.

By connecting the project to GitHub, Vercel will automatically create preview deployments for each push and pull request.

Alternatively, you can create a new preview deployment by running:

```sh
pnpm deploy:preview
```

### Production and releases

To release a new version, you must specify a `GITHUB_TOKEN` or `GH_TOKEN` environment variable at the root of the project. The token needs access to the `repository` and `workflow` scopes.

Once set up, run the following command to start an interactive release:

```sh
pnpm release
```

Once the release is created, a new production deployment will be automatically triggered.

To manually deploy to production without a release, use the command:

```sh
pnpm deploy:prod
```

## License

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
