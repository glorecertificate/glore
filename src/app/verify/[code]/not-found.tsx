import { getTranslations } from 'next-intl/server'

import { LookupForm } from '@/components/features/certificates/verify/lookup-form'
import { VerifyShell } from '@/components/features/certificates/verify/verify-shell'

export const generateMetadata = async () => {
  const t = await getTranslations('CertificateVerify')
  return { robots: { follow: false, index: false }, title: t('unknownTitle') }
}

const VerifyNotFound = async () => {
  const t = await getTranslations('CertificateVerify')

  return (
    <VerifyShell>
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t('unknownTitle')}</h1>
        <p className="mx-auto max-w-prose text-muted-foreground">{t('unknownMessage')}</p>
      </div>
      <LookupForm />
    </VerifyShell>
  )
}

export default VerifyNotFound
