import { defineConfig } from '@repo/release-config'

export default defineConfig({
  git: {
    requireBranch: 'main',
    requireCleanWorkingDir: true,
    pushArgs: ['--follow-tags', '--force'],
  },
  hooks: {
    'after:init': 'sh scripts/release.sh validate',
    'before:release': 'sh scripts/release.sh format',
  },
  plugins: {
    '@release-it/bumper': {
      out: ['./apps/elearning/config/metadata.json'],
    },
  },
})
