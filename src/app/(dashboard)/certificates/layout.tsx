import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/actions/user'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'certificates',
  })

const CertificatesLayout = async ({ children }: LayoutProps<'/certificates'>) => {
  const user = await getCurrentUser()
  if (user.canEdit) return notFound()
  return children
}

export default CertificatesLayout
