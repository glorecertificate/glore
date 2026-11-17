import { NotificationsContent } from '@/components/features/notifications/notifications-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'notifications',
})

const NotificationsPage = () => (
  <DashboardPage title={<PageTitle name="notifications" namespace="Layout" />} width="prose">
    <NotificationsContent />
  </DashboardPage>
)

export default NotificationsPage
