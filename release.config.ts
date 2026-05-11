import { type Config } from 'release-it'

interface Commit {
  body?: string | null
  committerDate?: string | null
  footer?: string | null
  hash?: string | null
  header?: string | null
  notes: {
    title: string
    text: string
  }[]
  references?: {
    issue: string
    prefix: string
  }[]
  revert?: Commit | null
  scope?: string | null
  shortHash?: string | null
  subject?: string | null
  type?: string | null
  version?: string | null
}

interface ReleaseItConfig extends Config {
  github?: Config['github'] & {
    releaseNotes?: string | ((context: { changelog: string }) => string)
  }
  plugins?: {
    '@release-it/bumper'?: {
      out: {
        file: string
        path: string
      }
    }
    '@release-it/conventional-changelog'?: {
      header?: string
      ignoreRecommendedBump?: boolean
      infile?: string
      preset?: {
        name: string
        types?: Array<{ type: string; section: string; scopes?: string[] }>
      }
      writerOpts?: {
        transform?: (commit: Commit) => Partial<Commit> | null
      }
    }
  }
}

const commitTypes = [
  { type: 'feat', section: 'Features' },
  { type: 'fix', section: 'Fixes' },
  { type: 'perf', section: 'Performance' },
  { type: 'build', section: 'Build', scopes: ['deps', 'dev-deps'] },
  { type: 'ci', section: 'CI' },
  { type: 'docs', section: 'Docs' },
  { type: 'chore', section: 'Other' },
  { type: 'refactor', section: 'Other' },
  { type: 'revert', section: 'Other' },
  { type: 'style', section: 'Other' },
]

export default {
  git: {
    commitMessage: 'chore(release): v${version}',
    push: true,
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    requireCleanWorkingDir: true,
    requireUpstream: true,
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
    releaseNotes: context => context.changelog.split('\n').slice(1).join('\n'),
  },
  npm: {
    publish: false,
  },
  hooks: {
    'before:init': ['pnpm run check:ci', 'pnpm run build'],
    'before:release': ['pnpm run format', 'git add .'],
  },
  plugins: {
    '@release-it/bumper': {
      out: {
        file: './config/metadata.json',
        path: 'version',
      },
    },
    '@release-it/conventional-changelog': {
      header: '# Changelog',
      ignoreRecommendedBump: true,
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: commitTypes,
      },
      writerOpts: {
        transform: (commit: Commit): Partial<Commit> | null => {
          const commitType = commitTypes.find(({ type }) => type === commit.type)
          if (!commitType) return null
          return {
            ...commit,
            type: commitType.section,
            shortHash: commit.hash?.slice(0, 7) ?? '',
            subject: commit.subject ? commit.subject.charAt(0).toUpperCase() + commit.subject.slice(1) : commit.subject,
          }
        },
      },
    },
  },
} satisfies ReleaseItConfig
