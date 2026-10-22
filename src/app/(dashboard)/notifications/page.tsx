import { NotificationsContent } from '@/components/features/notifications/notifications-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'notifications',
})

const NotificationsPage = () => (
  <DashboardPage className="py-8" title={<PageTitle name="notifications" namespace="Layout" />}>
    <NotificationsContent />
  </DashboardPage>
)

export default NotificationsPage
