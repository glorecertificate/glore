import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  return children
}
