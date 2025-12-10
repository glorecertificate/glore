import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/actions/user'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = intlMetadata({
  title: 'Layout.admin',
})

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.is_admin) return notFound()
  return children
}
