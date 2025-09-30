import { notFound } from 'next/navigation'

import { createApiClient } from '@/lib/api'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Navigation.admin',
})

export default async ({ children }: LayoutProps<'/admin'>) => {
  const api = await createApiClient()
  const user = await api.users.getCurrent()

  if (!user.isAdmin) return notFound()

  return children
}
