import { notFound } from 'next/navigation'
import { use } from 'react'

import { SuspenseLayout } from '@/components/layout/suspense-layout'
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
  <SuspenseLayout>
    <AdminLayoutContent {...props} />
  </SuspenseLayout>
)
