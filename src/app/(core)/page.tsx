import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'dashboard',
  })

export const Breadcrumb = <>{'Dashboard'}</>

export default () => <>{'Welcome!'}</>
