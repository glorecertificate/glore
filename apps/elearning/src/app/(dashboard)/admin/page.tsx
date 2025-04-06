import AdminDashboard from '@/components/admin/admin-dashboard'
import { generateAppMetadata } from '@/lib/metadata'

export default () => <AdminDashboard />

export const generateMetadata = generateAppMetadata({
  title: 'Navigation.admin',
})
