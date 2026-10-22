import { ShieldAlertIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const HolderDeletedView = async ({ code }: { code: string }) => {
  const t = await getTranslations('Certificates.verify')

  return (
    <>
      <div className="space-y-4 text-center">
        <Badge className="gap-1.5 border-destructive/30 bg-destructive/5 text-destructive-text" variant="outline">
          <ShieldAlertIcon className="size-3.5" />
          {t('holderDeleted')}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{t('holderDeletedTitle')}</h1>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">{t('holderDeletedMessage')}</p>
      </div>

      <Card>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('code')}</dt>
              <dd className="font-mono font-medium">{code}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </>
  )
}
