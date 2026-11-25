'use client'

import { useTranslations } from 'next-intl'

import { type CertificateInput, PAGE_HEIGHT, PAGE_WIDTH } from '@/components/features/certificates/certificate-layout'
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

const PAGE_FIT = { '--page-fit': `min(100cqw, ${PAGE_WIDTH / PAGE_HEIGHT} * 100cqh)` } as React.CSSProperties

export const PreviewDialog = ({
  busy,
  certificate,
  language,
  onCloseAutoFocus,
  onConfirm,
  onOpenChange,
  url,
}: {
  busy: boolean
  certificate: CertificateInput
  language?: string
  onCloseAutoFocus?: (event: Event) => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  url: string | null
}) => {
  const t = useTranslations('CertificateReview')

  return (
    <Dialog onOpenChange={onOpenChange} open={url !== null}>
      <DialogContent className="flex h-[92vh] flex-col sm:max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{t('previewTitle')}</DialogTitle>
          <DialogDescription>{t('previewDescription')}</DialogDescription>
        </DialogHeader>
        {url && (
          <div className="@container-size flex min-h-0 flex-1 items-center justify-center" style={PAGE_FIT}>
            <div className="w-(--page-fit)">
              <CertificatePage
                input={certificate}
                language={language}
                label={t('previewLabel', { organization: certificate.organization.name })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {url && (
            <Button asChild className="sm:mr-auto" icon="external-link" variant="ghost">
              <a href={url} rel="noopener noreferrer" target="_blank">
                {t('openPdf')}
              </a>
            </Button>
          )}
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
