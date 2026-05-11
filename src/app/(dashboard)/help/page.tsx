import { HelpContent } from '@/components/features/help/content'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'help',
  })

const HelpPage = () => (
  <>
    <PageHeader namespace="Layout" titleKey="help" />
    <PageMain>
      <HelpContent />
    </PageMain>
  </>
)

export default HelpPage
