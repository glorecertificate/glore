import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import { verifyCertificate } from '@/actions/certificates/public'
import { normalizeCertificateCode } from '@/components/features/certificates/rules'
import { VerificationView } from '@/components/features/certificates/verify/verification-view'
import { VerifyShell } from '@/components/features/certificates/verify/verify-shell'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { VERIFY_ROOT } from '@/lib/constants'
import { fullName } from '@/lib/utils'
import config from '~/config/metadata.json'

const ROBOTS = { follow: false, index: false } as const

export const generateMetadata = async ({ params }: PageProps<'/verify/[code]'>) => {
  const [{ code }, t] = await Promise.all([params, getTranslations('CertificateVerify')])
  const normalized = normalizeCertificateCode(code)
  const result = normalized ? await verifyCertificate(normalized) : null

  if (result?.outcome !== 'found') return { robots: ROBOTS, title: t('title') }

  const name = fullName(result.holder)
  const description = t('ogDescription', { name, org: result.organization.name })
  const url = `${VERIFY_ROOT}/${result.code}`

  return {
    alternates: { canonical: url },
    description,
    openGraph: { description, siteName: config.name, title: name, type: 'profile', url },
    robots: ROBOTS,
    title: name,
    twitter: { card: 'summary_large_image', description, title: name },
  }
}

const VerifyCodeContent = async ({ params }: Pick<PageProps<'/verify/[code]'>, 'params'>) => {
  const [{ code }, t] = await Promise.all([params, getTranslations('CertificateVerify')])
  const normalized = normalizeCertificateCode(code)
  if (!normalized) notFound()

  const result = await verifyCertificate(normalized)
  if (result.outcome === 'unknown') notFound()

  return (
    <VerifyShell>
      {result.outcome === 'limited' ? (
        <Banner variant="warning">
          <LucideIcon name="shield-alert" className="size-4 shrink-0" />
          {t('tooManyRequests')}
        </Banner>
      ) : (
        <VerificationView verification={result} />
      )}
    </VerifyShell>
  )
}

const VerifyCodePage = (props: PageProps<'/verify/[code]'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <VerifyCodeContent params={props.params} />
  </Suspense>
)

export default VerifyCodePage
