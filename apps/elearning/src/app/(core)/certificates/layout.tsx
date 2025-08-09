import { notFound } from 'next/navigation'

import { createApi } from '@/lib/api/server'
import { createMetadata } from '@/lib/metadata'

export const metadata = createMetadata({
  title: 'Navigation.certificates',
})

export default async ({ children }: React.PropsWithChildren) => {
  const api = await createApi()
  const user = await api.users.getCurrent()

  if (user.isEditor) return notFound()

  return children
}
