import { type Config } from 'release-it'

interface Context {
  changelog?: string
  version: string
}

interface ReleaseItConfig extends Config {
  github?: Config['github'] & {
    releaseNotes?: (context: Context) => string | undefined
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
    releaseNotes: (context: Context) => context.changelog?.split('\n').slice(1).join('\n'),
  },
  hooks: {
    'after:init': 'pnpm build && pnpm check',
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/bumper': {
      out: ['apps/*/package.json'],
    },
    '@release-it/conventional-changelog': {
      header: '# Changelog',
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
      },
    },
  },
} satisfies ReleaseItConfig
