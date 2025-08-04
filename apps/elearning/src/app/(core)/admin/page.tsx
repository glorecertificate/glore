import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { generatePageMetadata } from '@/lib/metadata'

export const generateMetadata = generatePageMetadata({
  title: 'Navigation.admin',
})

export default () => <AdminDashboard />
