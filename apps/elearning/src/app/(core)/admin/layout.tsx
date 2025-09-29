import { notFound } from 'next/navigation'

import { createApi } from '@/lib/api/ssr'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Navigation.admin',
})

export default async ({ children }: LayoutProps<'/admin'>) => {
  const api = await createApi()
  const user = await api.users.getCurrent()

  if (!user.isAdmin) return notFound()

  return children
}
