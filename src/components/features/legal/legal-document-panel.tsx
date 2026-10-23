'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { createDraft } from '@/actions/legal/manage'
import { LegalDraftEditor } from '@/components/features/legal/legal-draft-editor'
import { LegalHistory } from '@/components/features/legal/legal-history'
import { useLegalError } from '@/components/features/legal/use-legal-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type LegalDocumentRow } from '@/db/queries/legal'

export const LegalDocumentPanel = ({ canPublish, document }: { canPublish: boolean; document: LegalDocumentRow }) => {
  const t = useTranslations('LegalAdmin')
  const { dateTime } = useFormatter()
  const router = useRouter()
  const legalError = useLegalError()
  const [pending, startTransition] = useTransition()
  const current = document.versions.find(({ id }) => id === document.currentVersionId)

  const handleCreate = () => {
    startTransition(async () => {
      const { error } = await createDraft({ slug: document.slug })
      if (error) {
        toast.error(legalError(error))
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('current')}</CardTitle>
          <CardDescription>{current ? t('currentDescription') : t('noVersion')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3" data-testid="legal-current">
          {current && (
            <>
              <Badge variant="success">{t('version', { version: current.version })}</Badge>
              {current.effectiveAt && (
                <span className="text-sm" data-testid="legal-current-date">
                  {t('effective', {
                    date: dateTime(new Date(current.effectiveAt), { dateStyle: 'long', timeZone: 'UTC' }),
                  })}
                </span>
              )}
              {current.material && <Badge variant="warning">{t('material')}</Badge>}
            </>
          )}
          {!(document.draft || pending) && (
            <Button
              className="ml-auto"
              data-testid="legal-create-draft"
              onClick={handleCreate}
              type="button"
              variant="outline"
            >
              {current ? t('createDraftFrom', { version: current.version }) : t('createDraft')}
            </Button>
          )}
        </CardContent>
      </Card>

      {document.draft && <LegalDraftEditor canPublish={canPublish} document={document} draft={document.draft} />}

      <LegalHistory versions={document.versions} />
    </>
  )
}
