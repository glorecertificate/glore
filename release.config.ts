import { type GlobalConfig } from 'semantic-release'

const DEFAULT_COMMIT_TYPES = Object.freeze([
  { type: 'feat', section: 'Features' },
  { type: 'feature', section: 'Features' },
  { type: 'fix', section: 'Bug Fixes' },
  { type: 'perf', section: 'Performance Improvements' },
  { type: 'revert', section: 'Reverts' },
  { type: 'docs', section: 'Documentation', hidden: true },
  { type: 'style', section: 'Styles', hidden: true },
  { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
  { type: 'refactor', section: 'Code Refactoring', hidden: true },
  { type: 'test', section: 'Tests', hidden: true },
  { type: 'build', section: 'Build System', hidden: true },
  { type: 'ci', section: 'Continuous Integration', hidden: true },
])

export default {
  branches: ['+([0-9])?(.{+([0-9]),x}).x', 'main', 'next'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: DEFAULT_COMMIT_TYPES,
        },
      },
    ],
    [
      '@semantic-release/exec',
      {
        analyzeCommitsCmd: 'sh ./.husky/pre-release',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        writerOpts: {
          commitsSort: ['subject', 'scope'],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogTitle: 'Changelog',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'apps/*/package.json', 'apps/*/config/metadata.json'],
      },
    ],
    '@semantic-release/github',
    [
      'semantic-release-plugin-update-version-in-files',
      {
        files: ['apps/*/package.json', 'apps/*/config/metadata.json'],
        placeholder: '{{VERSION}}',
      },
    ],
  ],
} satisfies Partial<GlobalConfig>
