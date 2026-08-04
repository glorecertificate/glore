import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/actions/user'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'certificates',
})

const CertificatesLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}

const CertificatesLayout = ({ children }: LayoutProps<'/certificates'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <CertificatesLayoutContent>{children}</CertificatesLayoutContent>
  </Suspense>
)

export default CertificatesLayout
