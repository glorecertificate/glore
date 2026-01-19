import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'about',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <h1>{'about'}</h1>
    </PageMain>
  </>
)
