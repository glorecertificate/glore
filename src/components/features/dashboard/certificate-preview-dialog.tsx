'use client'

import { useTranslations } from 'next-intl'

import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type Certificate } from '@/db/queries/certificate'

export const CertificatePreviewDialog = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('Dashboard.journey')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon="eye" variant="outline">
          {t('actions.preview')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('preview.title')}</DialogTitle>
          <DialogDescription>{t('preview.description')}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto sheet-fit">
          <CertificatePreview certificate={certificate} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
