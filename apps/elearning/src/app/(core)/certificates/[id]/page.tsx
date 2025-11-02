import { notFound } from 'next/navigation'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = (await params) ?? {}
  if (!id) notFound()

  const certificate = null
  if (!certificate) notFound()

  return <CertificateDocument certificate={certificate} />
}
