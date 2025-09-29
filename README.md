<div align="center">
  <h1>
    <img src="./.github/assets/logo.svg" alt="" width="200">
  </h1>
  <a href="https://github.com/glorecertificate/glore/releases"><img src="https://img.shields.io/github/package-json/v/glorecertificate/glore?labelColor=24292e&color=5cb9d2&style=flat"></a>
  <a href="https://github.com/glorecertificate/glore/deployments/Production"><img src="https://img.shields.io/github/deployments/glorecertificate/glore/Production?logo=vercel&label=Production&labelColor=%2324292e"></a>
  <a href="https://github.com/glorecertificate/glore/deployments/Preview"><img src="https://img.shields.io/github/deployments/glorecertificate/glore/Preview?logo=vercel&label=Preview&labelColor=%2324292e"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/ci.yml"><img src="https://github.com/glorecertificate/glore/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/glorecertificate/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
</div>
<br>

GloRe is an official certificate that verifies volunteering activities.

Visit our website to find out how to sign up to the [e-learning platform](https://elearning.glorecertificate.net) and get the certificate recognizing your soft skills.

## About

The GloRe eLearning platform is a monorepository including a <a href="https://nextjs.org">Next.js</a> application backed by <a href="https://supabase.com">Supabase</a> and different utility packages.

The project uses <a href="https://tailwindcss.com">Tailwind CSS</a> and <a href="https://ui.shadcn.com">shadcn/ui</a> components for building a responsive and accessible user interface.

## Development

### Prerequisites

You must download and activate the Node.js version specified [here](.node-version).

A container tool that offers Docker compatible APIs is a prerequisite for local development.

If using [Docker Desktop](https://docs.docker.com/desktop), it is recommended to adjust Docker's resource allocation in `Settings > Resources > Advanced` to optimize performance, as the default values can lead to consume significant system resources.

Alternatively, a tool like [colima](https://github.com/abiosoft/colima) can be used to run containers without a GUI.

### Setup

Download the project using the GitHub client or Git:

```sh
gh repo clone glorecertificate/glore
# or
git clone https://github.com/glorecertificate/glore.git
```

Switch to the project directory and copy the example env file:

```sh
cd glore
cp .env.example .env
```

Open the new file and fill in the required values to gain access to the services used throughout the project.

### Running the application

Navigate to the project directory, activate pnpm using Corepack and install the project dependencies:

```sh
cd glore
corepack enable
corepack install
pnpm install
```

Run a development server with:

```bash
pnpm dev
```

This command will start the Next.js application, the Docker instance of Supabase, and the different background services.

Open [localhost:3000](http://localhost:3000) in your browser to see the result. Any changes you make to the code will be reflected in real time.

Supabase Studio, an interface for managing the local database, will be available at [localhost:54321](http://localhost:54321) while the Docker container is running.

<!-- Write working with the local database -->

### Contributing

To develop new features or bug fixes, create a new branch starting from `main` using a descriptive name that indicates the purpose of your changes:

```sh
git checkout -b feat/awesome-feature
# or
git checkout -b fix/bug-in-awesome-feature
```

Once you are done, push the branch, make sure that all checks are passing and create a new pull request.

## Deployment

The project is deployed on [Vercel](https://vercel.com).

To deploy the project, you must set up a Vercel account and link it to the GitHub repository. Once the repository is linked, you can deploy by pushing changes to any branch, and Vercel will automatically build and deploy a preview for you.

Alternatively, you can create a preview deployment by running:

```sh
pnpm deploy:preview
```

### Production and releases

To release a new version of the project, you must specify a `GITHUB_TOKEN` or `GH_TOKEN` environment variable at the root of the project. The token needs access to the `repository` and `workflow` scopes.

Then, run the following command to create a new interactive release and deploy it to production:

```sh
pnpm release
```

To manually trigger a production deployment without creating a release, use the command:

```sh
pnpm deploy:prod
```

## License

Copyright © 2025-present Associazione Joint <info@associazionejoint.org>
