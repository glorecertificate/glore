'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const PreviewDialog = ({
  busy,
  onConfirm,
  onOpenChange,
  url,
}: {
  busy: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  url: string | null
}) => {
  const t = useTranslations('CertificateReview')

  return (
    <Dialog onOpenChange={onOpenChange} open={url !== null}>
      <DialogContent className="flex max-h-[92vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('previewTitle')}</DialogTitle>
          <DialogDescription>{t('previewDescription')}</DialogDescription>
        </DialogHeader>
        {url && (
          <object
            aria-label={t('previewTitle')}
            className="h-[62vh] min-h-80 w-full rounded-md border bg-muted"
            data={url}
            type="application/pdf"
          />
        )}
        <DialogFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t('backToEditing')}
          </Button>
          <Button
            icon="check"
            loading={busy}
            loadingText={t('approving')}
            onClick={onConfirm}
            type="button"
            variant="brand"
          >
            {t('confirmApprove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
