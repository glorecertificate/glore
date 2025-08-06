import 'dotenv/config'

import { type Config, type Plugins } from './types'

const { ISSUE_PREFIX, ISSUE_URL } = process.env

export const DEFAULT_PLUGINS: Plugins = Object.freeze({
  '@release-it/conventional-changelog': {
    header: '# Changelog',
    ignoreRecommendedBump: true,
    infile: 'CHANGELOG.md',
    preset: {
      issuePrefixes: ISSUE_PREFIX ? [ISSUE_PREFIX] : [],
      issueUrlFormat: ISSUE_URL,
      name: 'conventionalcommits',
      types: [
        {
          section: 'Features ✨',
          type: 'feat',
        },
        {
          section: 'Fixes 🔧',
          type: 'fix',
        },
        {
          section: 'CI 🤖',
          type: 'ci',
        },
        {
          scopes: ['deps', 'dev-deps'],
          section: 'Build 📦',
          type: 'build',
        },
        {
          section: 'Docs 📑',
          type: 'docs',
        },
        {
          section: 'Other',
          type: 'chore',
        },
        {
          section: 'Other',
          type: 'perf',
        },
        {
          section: 'Other',
          type: 'refactor',
        },
        {
          section: 'Other',
          type: 'revert',
        },
        {
          section: 'Other',
          type: 'style',
        },
        {
          section: 'Other',
          type: 'test',
        },
      ].map(type => ({
        ...type,
        hidden: false,
      })),
    },
  },
  'release-it-pnpm': {
    publishCommand: '',
  },
})

export const DEFAULT_CONFIG: Config = Object.freeze({
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
  plugins: DEFAULT_PLUGINS,
})
