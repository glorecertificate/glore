import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'

const AdminLayout = async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}

export default AdminLayout
