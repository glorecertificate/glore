import { notFound } from 'next/navigation'

import { api } from '@/api/client'
import { CertificateDocument } from '@/components/features/certificate-document'
import { type PageProps, type Route } from '@/lib/navigation'

interface CertificatePageProps extends PageProps<Route.Certificates> {}

export default async ({ params }: CertificatePageProps) => {
  const { n } = (await params) ?? {}
  if (!n) return notFound()

  const certificates = await api.certificates.list()
  if (!certificates || !certificates.length) return notFound()

  const certificate = certificates[Number(n)]

  return <CertificateDocument certificate={certificate} />
}
