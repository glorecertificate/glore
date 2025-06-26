import releaseItConfig from '@repo/release-it-config'

export default releaseItConfig({
  afterBump: ['pnpm run format'],
  bumpFiles: ['apps/*/package.json', 'apps/**/metadata.json'],
  deployment: true,
})
