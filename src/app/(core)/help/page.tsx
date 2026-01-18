import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'help',
  })

export default () => <h1>{'Help'}</h1>
