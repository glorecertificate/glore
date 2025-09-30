import { notFound } from 'next/navigation'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { createApiClient } from '@/lib/api'

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = (await params) ?? {}
  if (!id) return notFound()

  const api = await createApiClient()

  const certificate = await api.certificates.find(id)
  if (!certificate) return notFound()

  return <CertificateDocument certificate={certificate} />
}
