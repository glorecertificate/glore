import { type Config } from 'release-it'

export default {
  git: {
    commitMessage: 'chore(release): v${version}',
    push: true,
    requireBranch: 'main',
    requireUpstream: true,
    tagName: 'v${version}',
    pushArgs: ['--follow-tags', '--force'],
    requireCleanWorkingDir: true,
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/bumper': {
      out: ['config/metadata.json'],
    },
    '@release-it/conventional-changelog': {
      header: '# Changelog',
      ignoreRecommendedBump: true,
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          { section: 'Features ✨', type: 'feat' },
          { section: 'Fixes 🔧', type: 'fix' },
          { section: 'CI 🤖', type: 'ci' },
          { section: 'Build 📦', scopes: ['deps', 'dev-deps'], type: 'build' },
          { section: 'Docs 📑', type: 'docs' },
          { section: 'Other', type: 'chore' },
          { section: 'Other', type: 'perf' },
          { section: 'Other', type: 'refactor' },
          { section: 'Other', type: 'revert' },
          { section: 'Other', type: 'style' },
          { section: 'Other', type: 'test' },
        ].map(type => ({ ...type, hidden: false })),
      },
    },
  },
} satisfies Config
