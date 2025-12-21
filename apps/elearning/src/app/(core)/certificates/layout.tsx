import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'
import { intlMetadata } from '@/lib/metadata'

export const meatdata = () =>
  intlMetadata({
    title: 'Layout.certificates',
  })

export default async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}
