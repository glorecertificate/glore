import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getViewer } from '@/actions/viewer'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { MessagesScope } from '@/components/providers/messages-scope'

const AdminLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const user = await getViewer()
  if (!user.isAdmin) return notFound()
  return children
}

const AdminLayout = ({ children }: LayoutProps<'/admin'>) => (
  <Suspense fallback={<DashboardLoading />}>
    <MessagesScope scope="admin">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </MessagesScope>
  </Suspense>
)

export default AdminLayout
