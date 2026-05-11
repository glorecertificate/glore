import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findPublicCertificate } from '@/actions/certificates/queries'
import { PublicCertificateView } from '@/components/features/certificates/public-certificate-view'
import config from '~/config/metadata.json'

export const generateMetadata = async ({ params, searchParams }: PageProps<'/[username]'>) => {
  const [{ username }, { v: handle }, t] = await Promise.all([params, searchParams, getTranslations('Certificates')])
  const resolvedHandle = typeof handle === 'string' ? handle : handle?.[0]
  const { data: cert } = await findPublicCertificate(username, resolvedHandle)

  if (!cert) return { title: t('publicNotFound') }

  const volunteerName = cert.user ? `${cert.user.firstName} ${cert.user.lastName}` : username
  const description = t('publicOgDescription', { name: volunteerName, org: cert.organization.name })
  const url = resolvedHandle ? `/${username}?v=${resolvedHandle}` : `/${username}`

  return {
    title: volunteerName,
    description,
    openGraph: {
      type: 'profile',
      title: volunteerName,
      description,
      url,
      siteName: config.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: volunteerName,
      description,
    },
  }
}

const UserPage = async ({ params, searchParams }: PageProps<'/[username]'>) => {
  const [{ username }, { v: handle }] = await Promise.all([params, searchParams])
  const { data: certificate } = await findPublicCertificate(username, typeof handle === 'string' ? handle : handle?.[0])
  if (!certificate) notFound()
  return <PublicCertificateView certificate={certificate} username={username} />
}

export default UserPage
