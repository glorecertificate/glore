import releaseItConfig from '@repo/release-it-config'

export default releaseItConfig({
  bumpFiles: ['apps/*/config/metadata.json', 'apps/*/package.json'],
})
