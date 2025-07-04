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

interface UserConfig extends Config {
  github: Config['github'] & {
    releaseNotes?: (context: Context) => string
  }
  plugins: Config['plugins'] & {
    '@release-it/bumper': {
      out: string[]
    }
    '@release-it/conventional-changelog': {
      infile?: string
      /** @default "# Changelog" */
      header?: string
      preset: {
        name: string
        types?: Array<{
          section: string
          type: string
        }>
      }
      writerOpts?: {
        groupBy?: string
        commitsSort?: string[]
      }
    }
  }
}

export default {
  git: {
    commitMessage: 'chore: release v${version}',
    push: true,
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
    releaseNotes: context =>
      [
        ...context.changelog.split('\n').slice(1),
        '',
        `**Full Changelog:** [\`v${context.latestVersion}...v${context.version}\`](https://github.com/gabrielecanepa/glore/compare/v${context.latestVersion}...v${context.version})`,
      ].join('\n'),
  },
  hooks: {
    'after:init': '[ -n "$(git log @{u}..)" ] && pnpm build && pnpm run check || exit 0',
    'after:bump': 'pnpm run format',
    'after:release':
      'echo v${version} scheduled for deployment ▷ https://github.com/${repo.repository}/deployments/Production',
  },
  npm: {
    publish: false,
  },
  plugins: {
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
            section: 'Features',
          },
          {
            type: 'fix',
            section: 'Fixes',
          },
          {
            type: 'build',
            section: 'Build',
          },
          {
            type: 'ci',
            section: 'CI',
          },
          {
            type: 'docs',
            section: 'Docs',
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
  },
} satisfies UserConfig
