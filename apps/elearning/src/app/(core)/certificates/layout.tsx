import { notFound } from 'next/navigation'

import { createMetadata } from '@/lib/metadata'
import { getCurrentUser } from '@/lib/ssr'

export const metadata = createMetadata({
  title: 'Navigation.certificates',
})

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}
