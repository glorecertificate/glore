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
          header: string
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
    autoGenerate: false,
    release: true,
    releaseName: 'v${version}',
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
      out: ['apps/*/package.json', 'apps/**/metadata.json'],
    },
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          {
            type: 'feat',
            header: 'Features',
          },
          {
            type: 'fix',
            header: 'Fixes',
          },
          {
            type: 'build',
            header: 'Build',
          },
          {
            type: 'ci',
            header: 'CI',
          },
          {
            type: 'docs',
            header: 'Docs',
          },
          {
            type: 'chore',
            header: 'Other',
          },
          {
            type: 'test',
            header: 'Other',
          },
          {
            type: 'style',
            header: 'Other',
          },
          {
            type: 'refactor',
            header: 'Other',
          },
          {
            type: 'perf',
            header: 'Other',
          },
          {
            type: 'revert',
            header: 'Other',
          },
        ],
      },
      writerOpts: {
        groupBy: 'header',
        commitsSort: ['type', 'header'],
      },
    },
  },
} satisfies UserConfig
