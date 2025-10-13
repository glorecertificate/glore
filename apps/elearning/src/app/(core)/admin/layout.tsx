import { notFound } from 'next/navigation'

import { createMetadata } from '@/lib/metadata'
import { getCurrentUser } from '@/lib/ssr'

export const metadata = createMetadata({
  title: 'Navigation.admin',
})

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}
