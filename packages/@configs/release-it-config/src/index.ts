import type { Config, JointConfig } from './types'

const DEPLOYMENT_MESSAGE =
  'echo v${version} scheduled for deployment ▷ https://github.com/${repo.repository}/deployments/Production'

export default (config: JointConfig = {}): Config => {
  const {
    afterBump = 'pnpm run format && git add .',
    afterInit = '[ -n "$(git log @{u}.. 2>/dev/null)" ] && (pnpm build && pnpm check) || exit 0',
    afterRelease: userAfterRelease = [],
    bumpFiles,
    changelog = true,
    deployments = false,
  } = config
  let { autoReleaseNotes = true } = config

  const afterRelease = deployments
    ? Array.isArray(userAfterRelease)
      ? [...userAfterRelease, DEPLOYMENT_MESSAGE]
      : [userAfterRelease, DEPLOYMENT_MESSAGE]
    : userAfterRelease

  if (autoReleaseNotes && !process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.warn('Auto releasing notes requires GITHUB_TOKEN or GH_TOKEN')
    autoReleaseNotes = false
  }

  return {
    git: {
      commitMessage: 'chore: release v${version}',
      push: true,
      pushArgs: ['--follow-tags', '--no-verify'],
      requireBranch: 'main',
      requireCleanWorkingDir: false,
      tagName: 'v${version}',
    },
    github: {
      autoGenerate: !autoReleaseNotes,
      release: true,
      releaseName: 'v${version}',
      releaseNotes: autoReleaseNotes
        ? context =>
            [
              ...context.changelog.split('\n').slice(1),
              `\n\n**Full Changelog:** [\`v${context.latestVersion}...v${context.version}\`](https://github.com/${context.repo.repository}/compare/v${context.latestVersion}...v${context.version})`,
            ].join('\n')
        : undefined,
      web: !autoReleaseNotes,
    },
    hooks: {
      'after:init': afterInit,
      'after:bump': afterBump,
      'after:release': afterRelease,
    },
    npm: {
      publish: false,
    },
    plugins: {
      '@release-it/bumper': {
        out: bumpFiles,
      },
      ...(changelog
        ? {
            '@release-it/conventional-changelog': {
              header: '# Changelog',
              infile: 'CHANGELOG.md',
              preset: {
                name: 'conventionalcommits',
                types: [
                  {
                    section: '🚀 Features',
                    type: 'feat',
                  },
                  {
                    section: '🔧 Fixes',
                    type: 'fix',
                  },
                  {
                    section: '🏗️ Build',
                    type: 'build',
                  },
                  {
                    section: '⚙️ CI',
                    type: 'ci',
                  },
                  {
                    section: '📑 Docs',
                    type: 'docs',
                  },
                  {
                    section: 'Other',
                    type: 'chore',
                  },
                  {
                    section: 'Other',
                    type: 'test',
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
          }
        : {}),
    },
  }
}
