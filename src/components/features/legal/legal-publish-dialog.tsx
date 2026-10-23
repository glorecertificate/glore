'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { publishVersion } from '@/actions/legal/manage'
import { useLegalError } from '@/components/features/legal/use-legal-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type LegalDocumentRow, type LegalVersionRow } from '@/db/queries/legal'

const today = () => {
  const now = new Date()
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(part => String(part).padStart(2, '0')).join('-')
}

const PublishForm = ({
  document,
  draft,
  onDone,
}: {
  document: LegalDocumentRow
  draft: LegalVersionRow
  onDone: () => void
}) => {
  const t = useTranslations('LegalAdmin')
  const router = useRouter()
  const legalError = useLegalError()
  const [effectiveAt, setEffectiveAt] = useState(today)
  const [material, setMaterial] = useState(false)
  const [changeNote, setChangeNote] = useState('')
  const [busy, setBusy] = useState(false)

  const handlePublish = async () => {
    setBusy(true)
    const { error } = await publishVersion({
      changeNote: changeNote.trim() || null,
      effectiveAt,
      material,
      versionId: draft.id,
    })
    setBusy(false)

    if (error) {
      toast.error(legalError(error))
      return
    }

    toast.success(t('published', { version: draft.version }))
    onDone()
    router.refresh()
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="legal-effective-at">{t('effectiveAt')}</Label>
          <Input
            disabled={busy}
            id="legal-effective-at"
            onChange={event => setEffectiveAt(event.target.value)}
            type="date"
            value={effectiveAt}
          />
        </div>
        {document.requiresAcceptance && (
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Switch
              aria-labelledby="legal-material-label"
              checked={material}
              className="mt-0.5"
              disabled={busy}
              onCheckedChange={setMaterial}
            />
            <div className="space-y-1">
              <Label id="legal-material-label">{t('materialLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('materialHelp')}</p>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="legal-change-note">{t('changeNote')}</Label>
          <Textarea
            disabled={busy}
            id="legal-change-note"
            maxLength={1000}
            onChange={event => setChangeNote(event.target.value)}
            placeholder={t('changeNotePlaceholder')}
            value={changeNote}
          />
        </div>
      </div>
      <DialogFooter>
        <Button disabled={busy} onClick={onDone} type="button" variant="outline">
          {t('cancel')}
        </Button>
        <Button
          data-testid="legal-publish-confirm"
          disabled={!effectiveAt}
          loading={busy}
          loadingText={t('publishing')}
          onClick={handlePublish}
          type="button"
          variant="brand"
        >
          {t('publishConfirm')}
        </Button>
      </DialogFooter>
    </>
  )
}

export const LegalPublishDialog = ({
  disabled,
  document,
  draft,
}: {
  disabled: boolean
  document: LegalDocumentRow
  draft: LegalVersionRow
}) => {
  const t = useTranslations('LegalAdmin')
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button data-testid="legal-publish" disabled={disabled} type="button" variant="brand">
          {t('publish')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('publishTitle', { version: draft.version })}</DialogTitle>
          <DialogDescription>{t('publishDescription')}</DialogDescription>
        </DialogHeader>
        <PublishForm document={document} draft={draft} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
