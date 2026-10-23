'use client'

import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { LegalVersionDialog } from '@/components/features/legal/legal-version-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type LegalVersionRow } from '@/db/queries/legal'

const STATUS_VARIANTS = { draft: 'info', published: 'success', superseded: 'muted' } as const

export const LegalHistory = ({ versions }: { versions: LegalVersionRow[] }) => {
  const t = useTranslations('LegalAdmin')
  const { dateTime } = useFormatter()
  const [selected, setSelected] = useState<LegalVersionRow | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('history')}</CardTitle>
        <CardDescription>{versions.length === 0 ? t('historyEmpty') : t('historyDescription')}</CardDescription>
      </CardHeader>
      {versions.length > 0 && (
        <CardContent>
          <ul className="divide-y" data-testid="legal-history">
            {versions.map(version => (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3" key={version.id}>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
                  <Badge variant={STATUS_VARIANTS[version.status]}>
                    {t('versionStatus', { status: t(`status_${version.status}`), version: version.version })}
                  </Badge>
                  {version.material && <Badge variant="warning">{t('material')}</Badge>}
                </div>
                <Button
                  className="ml-auto shrink-0 sm:order-last"
                  onClick={() => setSelected(version)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {t('view')}
                </Button>
                <div className="min-w-0 basis-full text-sm sm:flex-1 sm:basis-0">
                  {version.effectiveAt && (
                    <p>
                      {t('effective', {
                        date: dateTime(new Date(version.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
                      })}
                    </p>
                  )}
                  {version.publishedBy && (
                    <p className="text-muted-foreground">{t('publishedBy', { name: version.publishedBy })}</p>
                  )}
                  {version.changeNote && <p className="text-muted-foreground">{version.changeNote}</p>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <LegalVersionDialog onOpenChange={open => !open && setSelected(null)} version={selected} />
    </Card>
  )
}
