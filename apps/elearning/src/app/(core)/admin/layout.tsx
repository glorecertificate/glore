import { notFound } from 'next/navigation'
import { Suspense, use } from 'react'

import { getCurrentUser } from '@/lib/data/server'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = intlMetadata({
  title: 'admin',
})

const AdminLayoutContent = ({ children }: LayoutProps<'/admin'>) => {
  const user = use(getCurrentUser())
  if (!user.isAdmin) return notFound()
  return children
}

export default (props: LayoutProps<'/admin'>) => (
  <Suspense fallback={null}>
    <AdminLayoutContent {...props} />
  </Suspense>
)
