import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/data/server'
import { intlMetadata } from '@/lib/metadata'

export const meatdata = intlMetadata({
  title: 'Navigation.certificates',
})

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}
