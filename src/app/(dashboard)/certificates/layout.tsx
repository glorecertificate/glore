import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'certificates',
})

const CertificatesLayout = async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}

export default CertificatesLayout
