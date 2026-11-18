import { getTranslations } from 'next-intl/server'

import { BrandShell } from '@/components/features/auth/brand-shell'
import { Button } from '@/components/ui/button'
import { AUTH_ROOT } from '@/lib/constants'

export const VerifyShell = async ({ children }: { children: React.ReactNode }) => {
  const t = await getTranslations('CertificatePublic')

  return (
    <BrandShell
      actions={
        <Button
          asChild
          className="relative pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-1.5"
          size="sm"
          variant="band-secondary"
        >
          <a href={AUTH_ROOT}>{t('publicAccessApp')}</a>
        </Button>
      }
    >
      {children}
    </BrandShell>
  )
}
