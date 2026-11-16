import { DocsCategoryView } from '@/components/features/docs/category-view'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsFaq',
})

const DocsFaqPage = () => (
  <MessagesScope scope="docs">
    <DashboardPage title={<PageTitle namespace="Layout" name="docsFaq" />}>
      <DocsCategoryView slug="faq" />
    </DashboardPage>
  </MessagesScope>
)

export default DocsFaqPage
