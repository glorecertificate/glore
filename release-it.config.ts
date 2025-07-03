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

interface ReleaseItConfig extends Config {
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
      /** @default false */
      ignoreRecommendedBump?: boolean
      /** @default false */
      strictSemver?: boolean
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

export default {
  git: {
    commitMessage: 'chore: release v${version}',
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
  hooks: {
    'after:init': '[ -n "$(git log @{u}.. 2>/dev/null)" ] && pnpm build && pnpm check',
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
      header: '# Changelog',
      infile: 'CHANGELOG.md',
      ignoreRecommendedBump: true,
      strictSemver: true,
      preset: {
        name: 'conventionalcommits',
        types: [
          {
            section: 'Features',
            type: 'feat',
          },
          {
            section: 'Fixes',
            type: 'fix',
          },
          {
            section: 'Build',
            type: 'build',
          },
          {
            section: 'CI',
            type: 'ci',
          },
          {
            section: 'Docs',
            type: 'docs',
          },
          {
            section: 'Other',
            type: 'chore',
          },
          {
            section: 'Other',
            type: 'test',
          },
          {
            section: 'Other',
            type: 'style',
          },
          {
            section: 'Other',
            type: 'refactor',
          },
          {
            section: 'Other',
            type: 'perf',
          },
          {
            section: 'Other',
            type: 'revert',
          },
        ],
      },
    },
  },
} satisfies ReleaseItConfig
