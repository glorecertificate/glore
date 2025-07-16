import 'dotenv/config'

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
  plugins: {
    'release-it-pnpm': {
      publishCommand: string
    }
    '@release-it/bumper': {
      out: string[]
    }
    '@release-it/conventional-changelog': {
      /** @default "# Changelog" */
      header?: string
      infile?: string
      ignoreRecommendedBump?: boolean
      preset: {
        name: 'conventionalcommits'
        issuePrefixes?: string[]
        issueUrlFormat?: string
        types?: Array<{
          section: string
          type: string
          scope?: string
          hidden?: boolean
        }>
      }
    }
  }
}

const { ISSUE_PREFIX, ISSUE_URL } = process.env

const plugins = {
  'release-it-pnpm': {
    publishCommand: '',
  },
  '@release-it/bumper': {
    out: ['apps/*/package.json', 'apps/*/config/metadata.json'],
  },
  '@release-it/conventional-changelog': {
    infile: 'CHANGELOG.md',
    header: '# Changelog',
    ignoreRecommendedBump: true,
    preset: {
      name: 'conventionalcommits',
      issuePrefixes: ISSUE_PREFIX ? [ISSUE_PREFIX] : [],
      issueUrlFormat: ISSUE_URL,
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
          hidden: false,
        },
        {
          type: 'build',
          section: 'Build 📦',
          scopes: ['deps', 'dev-deps'],
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
          type: 'perf',
          section: 'Other',
        },
        {
          type: 'refactor',
          section: 'Other',
        },
        {
          type: 'revert',
          section: 'Other',
        },
        {
          type: 'style',
          section: 'Other',
        },
        {
          type: 'test',
          section: 'Other',
        },
      ].map(type => ({
        ...type,
        hidden: type.hidden ?? false,
      })),
    },
  },
} satisfies ReleaseConfig['plugins']

export default {
  plugins,
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
  },
  npm: {
    publish: false,
  },
  hooks: {
    'after:init': '[ -n "$(git log @{u}..)" ] && [ "$SKIP_CI" != 1 ] && pnpm build && pnpm run check || exit 0',
    'before:release': 'pnpm run format && git add .',
  },
} satisfies ReleaseConfig
