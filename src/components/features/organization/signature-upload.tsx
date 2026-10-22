'use client'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  confirmOrganizationSignature,
  createOrganizationSignatureUploadUrl,
  removeOrganizationSignature,
} from '@/actions/organizations/settings'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { SIGNATURE_CONTENT_TYPES } from '@/lib/constants'

import { useMemberError } from './use-member-error'

export const SignatureUpload = ({
  name,
  onChanged,
  organizationId,
  value,
}: {
  name: string
  onChanged: () => void
  organizationId?: number
  value: string | null
}) => {
  const t = useTranslations('Organization')
  const memberError = useMemberError()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const { data: presign, error } = await createOrganizationSignatureUploadUrl(file.type, file.size, organizationId)
      if (error || !presign) {
        toast.error(memberError(error?.code))
        return
      }
      const upload = await fetch(presign.url, { body: file, headers: { 'Content-Type': file.type }, method: 'PUT' })
      if (!upload.ok) {
        toast.error(t('signatureUploadError'))
        return
      }
      const { error: confirmError } = await confirmOrganizationSignature(presign.key, organizationId)
      if (confirmError) {
        toast.error(t('signatureUploadError'))
        return
      }
      toast.success(t('signatureUploaded'))
      onChanged()
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    const { error } = await removeOrganizationSignature(organizationId)
    setBusy(false)
    if (error) {
      toast.error(t('signatureRemoveError'))
      return
    }
    toast.success(t('signatureRemoved'))
    onChanged()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('signatureImage')}</p>
      {value && (
        <div className="flex h-24 w-56 items-center justify-center rounded-lg border bg-white p-2">
          <Image
            alt={t('signaturePreviewAlt', { name })}
            className="max-h-full w-auto object-contain"
            height={80}
            src={value}
            unoptimized
            width={200}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label={t('uploadSignature')}
          accept={SIGNATURE_CONTENT_TYPES.join(',')}
          className="sr-only"
          onChange={event => handleFile(event.target.files?.[0])}
          ref={input}
          tabIndex={-1}
          type="file"
        />
        <Button disabled={busy} onClick={() => input.current?.click()} size="sm" type="button" variant="outline">
          {value ? t('replaceSignature') : t('uploadSignature')}
        </Button>
        {value && (
          <Button disabled={busy} onClick={handleRemove} size="sm" type="button" variant="ghost">
            {t('removeSignature')}
          </Button>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground">{t('signatureHelp')}</p>
    </div>
  )
}
