import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/data/server'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = intlMetadata({
  title: 'admin',
})

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}
