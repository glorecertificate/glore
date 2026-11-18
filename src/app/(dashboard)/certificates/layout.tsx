import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getViewerContext } from '@/actions/viewer'
import { DashboardLoading } from '@/components/layout/dashboard-loading'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'certificates',
})

const CertificatesLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const { role, user } = await getViewerContext()
  if (user.isAdmin) return children
  if (user.canEdit) return notFound()
  if (role === 'learner') return notFound()
  return children
}

const CertificatesLayout = ({ children }: LayoutProps<'/certificates'>) => (
  <Suspense fallback={<DashboardLoading />}>
    <CertificatesLayoutContent>{children}</CertificatesLayoutContent>
  </Suspense>
)

export default CertificatesLayout
