import releaseItConfig from '@repo/release-it-config'

export default releaseItConfig({
  autoReleaseNotes: false,
  bumpFiles: ['apps/*/package.json', 'apps/**/metadata.json'],
  deployment: true,
})
