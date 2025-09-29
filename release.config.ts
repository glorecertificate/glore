import { releaseConfig } from '@repo/release-config'

export default releaseConfig({
  git: {
    pushArgs: ['--follow-tags', '--force'],
    requireBranch: 'main',
    requireCleanWorkingDir: true,
  },
  hooks: {
    'after:init': 'glore release validate',
    'before:release': 'glore release format',
  },
  plugins: {
    '@release-it/bumper': {
      out: ['config/metadata.json'],
    },
  },
})
