import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/actions/user'
import { DashboardLoading } from '@/components/layout/dashboard-loading'

const AdminLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}

const AdminLayout = ({ children }: LayoutProps<'/admin'>) => (
  <Suspense fallback={<DashboardLoading />}>
    <AdminLayoutContent>{children}</AdminLayoutContent>
  </Suspense>
)

export default AdminLayout
