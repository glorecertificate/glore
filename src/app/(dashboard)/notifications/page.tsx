import { NotificationsContent } from '@/components/features/notifications/notifications-content'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'notifications',
})

const NotificationsPage = () => (
  <DashboardPage width="prose">
    <NotificationsContent />
  </DashboardPage>
)

export default NotificationsPage
