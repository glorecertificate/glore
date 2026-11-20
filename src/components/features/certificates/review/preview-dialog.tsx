'use client'

import { useTranslations } from 'next-intl'

import { type CertificateInput } from '@/components/features/certificates/certificate-layout'
import { CertificatePage } from '@/components/features/certificates/certificate-page'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'

export const PreviewDialog = ({
  busy,
  certificate,
  language,
  onConfirm,
  onOpenChange,
  url,
}: {
  busy: boolean
  certificate: CertificateInput
  language?: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  url: string | null
}) => {
  const t = useTranslations('CertificateReview')
  const coarse = useCoarsePointer()

  return (
    <Dialog onOpenChange={onOpenChange} open={url !== null}>
      <DialogContent className="flex max-h-[92vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('previewTitle')}</DialogTitle>
          <DialogDescription>{t('previewDescription')}</DialogDescription>
        </DialogHeader>
        {url && coarse && (
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            <CertificatePage
              className="mx-auto max-w-md"
              input={certificate}
              language={language}
              label={t('previewLabel', { organization: certificate.organization.name })}
            />
            <Button asChild className="self-center" icon="external-link" size="sm" variant="outline">
              <a href={url} rel="noopener noreferrer" target="_blank">
                {t('openPdf')}
              </a>
            </Button>
          </div>
        )}
        {url && !coarse && (
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
