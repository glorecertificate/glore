import { notFound } from 'next/navigation'

import { CertificateDocument } from '@/components/features/certificates/certificate-document'
import { createApi } from '@/lib/api/server'
import { type PageProps, type Route } from '@/lib/navigation'

interface CertificatePageProps extends PageProps<Route.Certificates> {}

export default async ({ params }: CertificatePageProps) => {
  const { n } = (await params) ?? {}
  if (!n) return notFound()

  const api = await createApi()

  const certificates = await api.certificates.list()
  if (!certificates || !certificates.length) return notFound()

  const certificate = certificates[Number(n)]

  return <CertificateDocument certificate={certificate} />
}
