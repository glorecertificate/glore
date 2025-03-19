import AdminDashboard from '@/components/admin/admin-dashboard'
import { metadataFn } from '@/lib/metadata'

export default () => <AdminDashboard />

export const generateMetadata = metadataFn({
  title: 'Navigation.admin',
})
