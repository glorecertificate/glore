import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { AUTH_ROOT } from '@/lib/constants'

export const VerifyShell = async ({ children }: { children: React.ReactNode }) => {
  const t = await getTranslations('CertificatePublic')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo className="h-6 w-auto" />
          <Button asChild size="sm" variant="outline">
            <a href={AUTH_ROOT}>{t('publicAccessApp')}</a>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">{children}</main>
    </div>
  )
}
