import { type Config } from 'release-it'

export default {
  git: {
    commitMessage: 'chore: release v${version}',
    push: true,
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    tagName: 'v${version}',
  },
  github: {
    autoGenerate: true,
    release: true,
    releaseName: 'v${version}',
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
  },
} satisfies Config
