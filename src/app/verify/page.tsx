import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { ShieldCheckIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { isLookupLimited } from '@/actions/certificates/public'
import { normalizeCertificateCode } from '@/components/features/certificates/rules'
import { LookupForm } from '@/components/features/certificates/verify/lookup-form'
import { VerifyShell } from '@/components/features/certificates/verify/verify-shell'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { VERIFY_ROOT } from '@/lib/constants'

export const generateMetadata = async () => {
  const t = await getTranslations('Certificates.verify')
  return { description: t('description'), robots: { follow: false, index: false }, title: t('title') }
}

const VerifyContent = async ({ searchParams }: Pick<PageProps<'/verify'>, 'searchParams'>) => {
  const [t, { code }] = await Promise.all([getTranslations('Certificates.verify'), searchParams])
  const input = typeof code === 'string' ? code : code?.[0]

  const normalized = input ? normalizeCertificateCode(input) : null
  const limited = normalized ? await isLookupLimited() : false
  if (normalized && !limited) redirect(`${VERIFY_ROOT}/${normalized}`)
  const problem = input ? (limited ? 'limited' : 'invalid') : null

  return (
    <VerifyShell>
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand-text">
          <ShieldCheckIcon className="size-6" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mx-auto max-w-prose text-muted-foreground">{t('description')}</p>
      </div>
      <LookupForm defaultValue={input} />
      {problem && <Banner variant="warning">{problem === 'invalid' ? t('invalidCode') : t('tooManyRequests')}</Banner>}
    </VerifyShell>
  )
}

const VerifyPage = (props: PageProps<'/verify'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <VerifyContent searchParams={props.searchParams} />
  </Suspense>
)

export default VerifyPage
