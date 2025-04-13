import { type Config } from 'release-it'

export default {
  git: {
    commitMessage: 'chore: release v${version}',
    push: true,
    pushArgs: ['--follow-tags', '--no-verify'],
    requireBranch: 'main',
    requireCleanWorkingDir: false,
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
    'after:release': 'echo Version ${version} released and scheduled for deployment {repo}/deployments/Production',
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
        types: [
          {
            section: 'Features',
            type: 'feat',
          },
          {
            section: 'Bug Fixes',
            type: 'fix',
          },
          {
            section: 'Build System',
            type: 'build',
          },
          {
            section: 'Tests',
            type: 'test',
          },
          {
            section: 'Continuous Integration',
            type: 'ci',
          },
          {
            section: 'Documentation',
            type: 'docs',
          },
          {
            section: 'Other',
            type: 'chore',
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
} satisfies Config
