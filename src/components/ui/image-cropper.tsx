'use client'

import dynamic from 'next/dynamic'
import { useEffect, useImperativeHandle, useState } from 'react'

import { useTranslations } from 'next-intl'
import { type FileRejection, useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { LucideIcon } from '@/components/icons/lucide'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import app from '~/config/app.json'

const ImageCropDialog = dynamic(async () => (await import('@/components/ui/image-crop-dialog')).ImageCropDialog, {
  ssr: false,
})

interface SelectedImage {
  file: File
  previewUrl: string
}

export interface ImageCropperHandle {
  open: () => void
}

export const ImageCropper = ({
  disabled,
  fallback,
  onChange,
  onRemove,
  pickerRef,
  trigger,
  value,
}: {
  disabled?: boolean
  fallback?: React.ReactNode
  onChange?: (file: File) => Promise<void> | void
  onRemove?: () => void
  pickerRef?: React.Ref<ImageCropperHandle>
  trigger?: React.ReactNode
  value?: string | null
}) => {
  const t = useTranslations('Components.ImageCropper')

  const [selected, setSelected] = useState<SelectedImage | null>(null)

  useEffect(() => {
    if (!selected) return
    return () => URL.revokeObjectURL(selected.previewUrl)
  }, [selected])

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setSelected({ file, previewUrl: URL.createObjectURL(file) })
  }

  const closeCropDialog = () => setSelected(null)

  const onDropRejected = (rejections: FileRejection[]) => {
    const tooLarge = rejections.some(rejection => rejection.errors.some(error => error.code === 'file-too-large'))
    if (tooLarge) toast.error(t('avatarTooLarge', { size: app.maxAvatarSize / 1024 }))
  }

  const {
    getRootProps,
    getInputProps,
    open: openPicker,
  } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    disabled,
    maxFiles: 1,
    maxSize: app.maxAvatarSize * 1024,
    onDrop,
    onDropRejected,
  })

  const { role: _role, tabIndex: _tabIndex, ...buttonProps } = getRootProps()

  useImperativeHandle(pickerRef, () => ({ open: openPicker }), [openPicker])

  const cropDialog = selected ? (
    <ImageCropDialog
      file={selected.file}
      onChange={onChange}
      onClose={closeCropDialog}
      previewUrl={selected.previewUrl}
    />
  ) : null

  if (trigger) {
    if (pickerRef) {
      return (
        <>
          <div className="w-fit">
            {trigger}
            <input {...getInputProps({ 'aria-label': t('uploadAvatar') })} />
          </div>
          {cropDialog}
        </>
      )
    }

    return (
      <>
        <div {...getRootProps()} className={cn('w-fit', !disabled && 'cursor-pointer')}>
          {trigger}
          <input {...getInputProps({ 'aria-label': t('uploadAvatar') })} />
        </div>
        {cropDialog}
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative size-24 shrink-0">
          <Avatar className="size-24 rounded-2xl border shadow-2xs ring-0 ring-ring/20 transition-shadow group-hover:ring-4">
            <AvatarImage className="object-cover" src={value || undefined} />
            <AvatarFallback className="bg-muted/40 text-3xl text-muted-foreground">{fallback ?? '?'}</AvatarFallback>
          </Avatar>
          <div
            {...getRootProps()}
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-foreground/0 transition-colors',
              !disabled && 'cursor-pointer group-hover:bg-foreground/40'
            )}
          >
            <LucideIcon
              name="camera"
              className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
          <input {...getInputProps({ 'aria-label': t('uploadAvatar') })} />
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" type="button" variant="outline" {...buttonProps} className="w-fit" disabled={disabled}>
            <LucideIcon name="cloud-upload" className="mr-2 size-4" />
            {value ? t('changeAvatar') : t('uploadAvatar')}
          </Button>

          {value && onRemove ? (
            <Button
              className="w-fit text-destructive-text hover:bg-destructive/10 hover:text-destructive-text"
              disabled={disabled}
              onClick={onRemove}
              size="sm"
              type="button"
              variant="ghost"
            >
              <LucideIcon name="trash-2" className="mr-2 size-4" />
              {t('remove')}
            </Button>
          ) : null}
        </div>
      </div>

      {cropDialog}
    </>
  )
}
