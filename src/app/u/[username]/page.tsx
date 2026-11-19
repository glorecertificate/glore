import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { findPublicCertificate } from '@/actions/certificates/queries'
import { PublicCertificateView } from '@/components/features/certificates/public-certificate-view'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { fullName } from '@/lib/utils'
import config from '~/config/metadata.json'

export const generateMetadata = async ({ params }: PageProps<'/u/[username]'>) => {
  const { username } = await params
  const [{ data: cert }, t] = await Promise.all([findPublicCertificate(username), getTranslations('CertificatePublic')])

  if (!cert) return { robots: { follow: false, index: false }, title: t('publicNotFound') }

  const volunteerName = cert.user ? fullName(cert.user) : username
  const description = t('publicOgDescription', { name: volunteerName, org: cert.organization.name })
  const url = `/@${username}`

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

const UserPageContent = async ({ params }: PageProps<'/u/[username]'>) => {
  const { username } = await params
  const { data } = await findPublicCertificate(username)
  if (!data) notFound()
  return <PublicCertificateView certificate={data} username={username} />
}

const UserPage = (props: PageProps<'/u/[username]'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <UserPageContent {...props} />
  </Suspense>
)

export default UserPage
