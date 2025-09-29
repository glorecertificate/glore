import { notFound } from 'next/navigation'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { createApi } from '@/lib/api/ssr'

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = (await params) ?? {}
  if (!id) return notFound()

  const api = await createApi()

  const certificate = await api.certificates.find(id)
  if (!certificate) return notFound()

  return <CertificateDocument certificate={certificate} />
}
