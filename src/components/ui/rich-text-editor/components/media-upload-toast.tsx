'use client'

import { useEffect } from 'react'

import { PlaceholderPlugin, UploadErrorCode } from '@platejs/media/react'
import { useTranslations } from 'next-intl'
import { usePluginOption } from 'platejs/react'
import { toast } from 'sonner'

export const MediaUploadToast = () => {
  useUploadErrorToast()

  return null
}

const useUploadErrorToast = () => {
  const t = useTranslations('Components.RichTextEditor.media')
  const uploadError = usePluginOption(PlaceholderPlugin, 'error')

  useEffect(() => {
    if (!uploadError) {
      return
    }

    const { code, data } = uploadError

    switch (code) {
      case UploadErrorCode.INVALID_FILE_SIZE: {
        toast.error(t('uploadInvalidSize', { files: data.files.map(f => f.name).join(', ') }))

        break
      }
      case UploadErrorCode.INVALID_FILE_TYPE: {
        toast.error(t('uploadInvalidType', { files: data.files.map(f => f.name).join(', ') }))

        break
      }
      case UploadErrorCode.TOO_LARGE: {
        toast.error(
          t('uploadTooLarge', { files: data.files.map(f => f.name).join(', '), maxFileSize: data.maxFileSize })
        )

        break
      }
      case UploadErrorCode.TOO_LESS_FILES: {
        toast.error(t('uploadTooFew', { count: data.minFileCount }))

        break
      }
      case UploadErrorCode.TOO_MANY_FILES: {
        toast.error(t('uploadTooMany', { count: data.maxFileCount }))

        break
      }
    }
  }, [t, uploadError])
}
