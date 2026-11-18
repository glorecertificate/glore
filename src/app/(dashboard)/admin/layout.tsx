import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getViewer } from '@/actions/viewer'
import { DashboardLoading } from '@/components/layout/dashboard-loading'

const AdminLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const user = await getViewer()
  if (!user.isAdmin) return notFound()
  return children
}

const AdminLayout = ({ children }: LayoutProps<'/admin'>) => (
  <Suspense fallback={<DashboardLoading />}>
    <AdminLayoutContent>{children}</AdminLayoutContent>
  </Suspense>
)

export default AdminLayout
