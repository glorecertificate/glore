import releaseItConfig from '@repo/release-it-config'

export default releaseItConfig({
  autoReleaseNotes: false,
  bumpFiles: ['apps/*/config/metadata.json', 'apps/*/package.json'],
})
