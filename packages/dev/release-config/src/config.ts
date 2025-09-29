import { type Options, type Plugins } from './types'

export const RELEASE_PLUGINS: Plugins = {
  '@release-it/conventional-changelog': {
    header: '# Changelog',
    ignoreRecommendedBump: true,
    infile: 'CHANGELOG.md',
    preset: {
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
}

export const RELEASE_OPTIONS: Options = {
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
  plugins: RELEASE_PLUGINS,
}
