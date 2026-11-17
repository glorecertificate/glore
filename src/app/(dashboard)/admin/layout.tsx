import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/actions/user'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { MessagesScope } from '@/components/providers/messages-scope'

const AdminLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}

const AdminLayout = ({ children }: LayoutProps<'/admin'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <MessagesScope scope="admin">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </MessagesScope>
  </Suspense>
)

export default AdminLayout
