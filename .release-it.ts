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
    // Run checks only with unpushed commits
    'after:init': '[ -n "$(git log @{u}.. 2>/dev/null)" ] && (pnpm build && pnpm check) || exit 0',
    'after:release': 'echo "Version ${version} released and scheduled for deployment"',
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
