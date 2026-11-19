import { DocsCategoryView } from '@/components/features/docs/category-view'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsIntro',
})

const DocsIntroPage = () => (
  <MessagesScope scope="docs">
    <DashboardPage parent="docs" title={<PageTitle namespace="Layout" name="docsIntro" />}>
      <DocsCategoryView slug="intro" />
    </DashboardPage>
  </MessagesScope>
)

export default DocsIntroPage
