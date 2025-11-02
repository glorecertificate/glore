import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/data/server'
import { createMetadata } from '@/lib/metadata'

export const meatdata = createMetadata({
  title: 'certificates',
})

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}
