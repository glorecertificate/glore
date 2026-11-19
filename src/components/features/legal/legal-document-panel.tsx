'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { createDraft } from '@/actions/legal/manage'
import { LegalDraftEditor } from '@/components/features/legal/legal-draft-editor'
import { LegalHistory } from '@/components/features/legal/legal-history'
import { useLegalError } from '@/components/features/legal/use-legal-error'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { type LegalDocumentRow } from '@/db/queries/legal'

export const LegalDocumentPanel = ({ canPublish, document }: { canPublish: boolean; document: LegalDocumentRow }) => {
  const t = useTranslations('LegalAdmin')
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

  const createDraftButton = document.draft ? (
    <Button asChild variant="brand">
      <a href="#legal-draft">{t('editDraft')}</a>
    </Button>
  ) : (
    <Button data-testid="legal-create-draft" loading={pending} onClick={handleCreate} type="button" variant="brand">
      {current ? t('createDraftFrom', { version: current.version }) : t('createDraft')}
    </Button>
  )

  return (
    <>
      <LegalHistory action={createDraftButton} slug={document.slug} versions={document.versions} />

      {document.draft && (
        <div id="legal-draft">
          <LegalDraftEditor canPublish={canPublish} document={document} draft={document.draft} />
        </div>
      )}
    </>
  )
}
