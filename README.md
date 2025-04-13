<div align="center">
  <img src="https://raw.githubusercontent.com/gabrielecanepa/glore/refs/heads/main/.github/assets/glore.png" alt="" width="90">
  <h1>
    GloRe Certificate
    <a href="https://github.com/gabrielecanepa/glore/releases"><img src="https://img.shields.io/github/package-json/v/gabrielecanepa/glore?color=%23afc861&labelColor=%2324292e"></a>
  </h1>
  <a href="https://github.com/gabrielecanepa/glore/deployments/Production"><img src="https://img.shields.io/github/deployments/gabrielecanepa/glore/Production?logo=vercel&label=Production&labelColor=%2324292e"></a>
  <a href="https://github.com/gabrielecanepa/glore/deployments/Preview"><img src="https://img.shields.io/github/deployments/gabrielecanepa/glore/Preview?logo=vercel&label=Preview&labelColor=%2324292e"></a>
  <a href="https://github.com/gabrielecanepa/glore/actions/workflows/ci.yml"><img src="https://github.com/gabrielecanepa/glore/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/gabrielecanepa/glore/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/gabrielecanepa/glore/actions/workflows/github-code-scanning/codeql/badge.svg"></a>
</div>
<br>

GloRe is an official certificate that verifies volunteering activities.

Visit our website to find out how to sign up to the [e-learning platform](https://elearning.glorecertificate.net) and get the certificate recognizing your soft skills.

## About

The GloRe eLearning platform is a monorepository including a <a href="https://nextjs.org">Next.js</a> application backed by <a href="https://supabase.com">Supabase</a> and different utility packages.

The project uses <a href="https://tailwindcss.com">Tailwind CSS</a> and <a href="https://ui.shadcn.com">shadcn/ui</a> components for building a responsive and accessible user interface.

## Development

### Prerequisites

You must download and activate the Node.js version specified [here](https://github.com/gabrielecanepa/glore/blob/main/.node-version).

### Setup

Download the project using the GitHub client or Git:

```sh
gh repo clone gabrielecanepa/glore
# or
git clone https://github.com/gabrielecanepa/glore.git
```

Switch to the project directory and copy the the example environment file to `.env`:

```sh
cd apps/elearning
cp .env.example .env
```

Fill in the required environment variables to gain access to the services used by the application.

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

Open [localhost:3000](http://localhost:3000) in your browser to see the result. Any changes you make to the code will be reflected in real time.

### Contributing

To develop new features or fix bugs, create a new branch from the `main` branch. Use a descriptive name for the branch that indicates the purpose of your changes:

```sh
git checkout -b feature/my-feature-name
# or
git checkout -b fix/my-fix-name
```

Once you are done, push the branch to the repository and create a pull request.

## Deployments

The project is deployed using [Vercel](https://vercel.com).

To deploy the project, you must set up a Vercel account and link it to the GitHub repository.

Once you have done that, you can deploy by pushing changes to any branch. Vercel will automatically build and deploy a preview for you.

Alternatively, you can create a preview deployment by running:

```sh
pnpm deploy
```

### Production deployments and releases

To release a new version of the project, you must specify a `GITHUB_TOKEN` or `GH_TOKEN` environment variable at the root of the project. The token needs access to the `repository` and `workflow` scopes.

Then, run the following command to create a new interactive release and deploy it to production:

```sh
pnpm release
```

To manually trigger a production deployment without creating a release, use the command:

```sh
pnpm deploy:production
```

## License

[MIT](LICENSE) © [Associazione Joint](https://associazionejoint.org)
