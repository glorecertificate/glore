import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'docsFaq',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <h1>{'Docs FAQs'}</h1>
    </PageMain>
  </>
)
