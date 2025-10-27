import { notFound } from 'next/navigation'
import { Suspense, use } from 'react'

import { LoadingView } from '@/components/layout/loading-view'
import { getCurrentUser } from '@/lib/data/server'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'certificates',
})

const CertificateGuard = ({ children }: LayoutProps<'/certificates'>) => {
  const user = use(getCurrentUser())
  if (user.canEdit) return notFound()
  return children
}

export default (props: LayoutProps<'/certificates'>) => (
  <Suspense fallback={<LoadingView />}>
    <CertificateGuard {...props} />
  </Suspense>
)
