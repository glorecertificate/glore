import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'

export default async ({ children }: LayoutProps<'/admin'>) => {
  const user = await getCurrentUser()
  if (!user.is_admin) return notFound()
  return children
}
