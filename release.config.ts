import { type Config } from 'release-it'

interface Context {
  branchName: string
  changelog: string
  latestVersion: string
  name: string
  releaseUrl: string
  repo: {
    remote: string
    protocol: string
    host: string
    owner: string
    repository: string
    project: string
  }
  version: string
}

interface ReleaseConfig extends Config {
  github: Config['github'] & {
    releaseNotes?: (context: Context) => string
  }
  hooks: Config['hooks'] & {
    [K in keyof typeof plugins as `${'before' | 'after'}:${K}:${'init' | 'bump' | 'release'}`]?:
      | string
      | string[]
      | ((context: Context) => string | string[])
  }
  plugins: Config['plugins'] & {
    '@release-it/bumper': {
      out: string[]
    }
    '@release-it/conventional-changelog': {
      /** @default "# Changelog" */
      header?: string
      infile?: string
      preset: {
        name: string
        types?: Array<{
          section: string
          type: string
        }>
      }
    }
  }
}

const plugins = {
  '@release-it/bumper': {
    out: ['apps/*/package.json', 'apps/*/config/metadata.json'],
  },
  '@release-it/conventional-changelog': {
    infile: 'CHANGELOG.md',
    preset: {
      name: 'conventionalcommits',
      types: [
        {
          type: 'feat',
          section: 'Features ✨',
        },
        {
          type: 'fix',
          section: 'Fixes 🔧',
        },
        {
          type: 'ci',
          section: 'CI 🤖',
        },
        {
          type: 'build',
          section: 'Build 📦',
        },
        {
          type: 'docs',
          section: 'Docs 📑',
        },
        {
          type: 'chore',
          section: 'Other',
        },
        {
          type: 'test',
          section: 'Other',
        },
        {
          type: 'style',
          section: 'Other',
        },
        {
          type: 'refactor',
          section: 'Other',
        },
        {
          type: 'perf',
          section: 'Other',
        },
        {
          type: 'revert',
          section: 'Other',
        },
      ],
    },
  },
} satisfies Config['plugins']

export default {
  git: {
    addUntrackedFiles: true,
    commitMessage: 'chore(release): v${version}',
    push: true,
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    requireUpstream: true,
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
    releaseNotes: context =>
      [
        ...context.changelog.split('\n').slice(1),
        '<h1></h1>',
        `**Full Changelog:** [\`v${context.latestVersion}...v${context.version}\`](https://github.com/gabrielecanepa/glore/compare/v${context.latestVersion}...v${context.version})`,
      ].join('\n\n'),
  },
  npm: {
    publish: false,
  },
  plugins,
  hooks: {
    'after:init': '[ -n "$(git log @{u}..)" ] && pnpm build && pnpm run check || exit 0',
    'after:@release-it/conventional-changelog:release': 'pnpm run format && pnpm add .',
    'after:release':
      'echo v${version} scheduled for deployment ▷ https://github.com/${repo.repository}/deployments/Production',
  },
} satisfies ReleaseConfig
