import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docs',
  })

export default () => <h1>{'Docs'}</h1>
