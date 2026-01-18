import { type Config } from 'release-it'

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
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/bumper': {
      out: {
        file: './config/app.json',
        path: 'metadata.version',
      },
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
  hooks: {
    'before:release': 'biome format --fix && git add .',
  },
} satisfies Config
