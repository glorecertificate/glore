import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docs',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <h1>{'Docs'}</h1>
    </PageMain>
  </>
)
