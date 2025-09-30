import { notFound } from 'next/navigation'

import { createApiClient } from '@/lib/api'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Navigation.certificates',
})

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const api = await createApiClient()
  const user = await api.users.getCurrent()

  if (user.canEdit) return notFound()

  return children
}
