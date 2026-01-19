import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'help',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <h1>{'Help'}</h1>
    </PageMain>
  </>
)
