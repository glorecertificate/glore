import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { generateLocalizedMetadata } from '@/lib/metadata'

export default () => <AdminDashboard />

export const generateMetadata = generateLocalizedMetadata({
  title: 'Navigation.admin',
})
