import { HelpContent } from '@/components/features/help'
import { HelpIntro } from '@/components/features/help/intro'
import { HelpRoleChip } from '@/components/features/help/role-chip'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'help',
})

const HelpPage = () => (
  <MessagesScope scope="help">
    <DashboardPage
      breadcrumb={<HelpRoleChip />}
      description={<HelpIntro />}
      title={<PageTitle namespace="Layout" name="help" />}
    >
      <HelpContent />
    </DashboardPage>
  </MessagesScope>
)

export default HelpPage
