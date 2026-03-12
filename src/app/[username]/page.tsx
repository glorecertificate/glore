import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findPublicCertificate } from '@/actions/certificate'
import { PublicCertificateView } from '@/components/features/certificates/public-certificate-view'

export const generateMetadata = async ({ params, searchParams }: PageProps<'/[username]'>) => {
  const { username } = await params
  const { v: handle } = await searchParams
  const t = await getTranslations('Certificates')
  const { data: cert } = await findPublicCertificate(username, typeof handle === 'string' ? handle : handle?.[0])

  if (!cert) return { title: t('publicNotFound') }

  const volunteerName = cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : username
  return { title: volunteerName }
}

export default async ({ params, searchParams }: PageProps<'/[username]'>) => {
  const { username } = await params
  const { v: handle } = await searchParams
  const { data: certificate } = await findPublicCertificate(username, typeof handle === 'string' ? handle : handle?.[0])
  if (!certificate) notFound()
  return <PublicCertificateView certificate={certificate} />
}
