import { notFound } from 'next/navigation'

import { createApi } from '@/lib/api/ssr'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Navigation.certificates',
})

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const api = await createApi()
  const user = await api.users.getCurrent()

  if (user.canEdit) return notFound()

  return children
}
