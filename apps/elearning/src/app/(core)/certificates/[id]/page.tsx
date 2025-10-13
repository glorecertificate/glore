import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { findCertificate } from '@/lib/data/server'

const getCertificate = unstable_cache(async (id: number | string) => findCertificate(id), ['certificate-by-id'], {
  tags: ['certificates'],
})

export default async ({ params }: PageProps<'/certificates/[id]'>) => {
  const { id } = (await params) ?? {}
  if (!id) notFound()

  const certificate = await getCertificate(id)
  if (!certificate) notFound()

  return <CertificateDocument certificate={certificate} />
}
