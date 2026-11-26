import { getTranslations } from 'next-intl/server'

import { LookupForm } from '@/components/features/certificates/verify/lookup-form'
import { VerifyShell } from '@/components/features/certificates/verify/verify-shell'
import { MessagesScope } from '@/components/providers/messages-scope'
import { Card } from '@/components/ui/card'

export const generateMetadata = async () => {
  const t = await getTranslations('CertificateVerify')
  return { robots: { follow: false, index: false }, title: t('unknownTitle') }
}

const VerifyNotFound = async () => {
  const t = await getTranslations('CertificateVerify')

  return (
    <MessagesScope scope="verify">
      <VerifyShell>
        <Card className="gap-6 p-6 sm:p-8">
          <div className="space-y-3 text-center">
            <h1 className="type-title text-balance text-fg-title">{t('unknownTitle')}</h1>
            <p className="mx-auto max-w-prose text-muted-foreground">{t('unknownMessage')}</p>
          </div>
          <LookupForm />
        </Card>
      </VerifyShell>
    </MessagesScope>
  )
}

export default VerifyNotFound
