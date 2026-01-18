import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'admin',
  })

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.is_admin) return notFound()
  return children
}
