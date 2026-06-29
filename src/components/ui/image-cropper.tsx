'use client'

import 'react-image-crop/dist/ReactCrop.css'

import { type SyntheticEvent, useRef, useState } from 'react'

import { CameraIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FileRejection, useDropzone } from 'react-dropzone'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import app from '~/config/app.json'

const cropImage = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      'image/png',
      1.0
    )
  })
}

export const ImageCropper = ({
  disabled,
  fallback,
  onChange,
  onRemove,
  trigger,
  value,
}: {
  disabled?: boolean
  fallback?: React.ReactNode
  onChange?: (file: File) => Promise<void> | void
  onRemove?: () => void
  trigger?: React.ReactNode
  value?: string | null
}) => {
  const t = useTranslations('Components.ImageCropper')

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const selectedRef = useRef<File | null>(null)
  const completedRef = useRef<PixelCrop | undefined>(undefined)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) {
      return
    }
    selectedRef.current = file
    setPreviewUrl(URL.createObjectURL(file))
    setOpen(true)
  }

  const onDropRejected = (rejections: FileRejection[]) => {
    const tooLarge = rejections.some(rejection => rejection.errors.some(error => error.code === 'file-too-large'))
    if (tooLarge) toast.error(t('avatarTooLarge', { size: app.maxAvatarSize / 1024 }))
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    disabled,
    maxFiles: 1,
    maxSize: app.maxAvatarSize * 1024,
    onDrop,
    onDropRejected,
  })

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height))
  }

  const handleCrop = async () => {
    const completedCrop = completedRef.current
    const selectedFile = selectedRef.current
    if (imageRef.current && completedCrop?.width && completedCrop?.height && selectedFile) {
      try {
        setSaving(true)
        const blob = await cropImage(imageRef.current, completedCrop)
        const file = new File([blob], selectedFile.name, { type: 'image/png' })
        await onChange?.(file)
        setOpen(false)
        setPreviewUrl(null)
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }
  }

  const cropDialog = (
    <Dialog
      onOpenChange={isOpen => {
        setOpen(isOpen)
        if (!isOpen) {
          setPreviewUrl(null)
          selectedRef.current = null
        }
      }}
      open={open}
    >
      <DialogTitle className="hidden" />
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <div className="mt-4">
          {previewUrl && (
            <ReactCrop
              aspect={1}
              className="mx-auto"
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={c => {
                completedRef.current = c
              }}
            >
              <img
                alt="Crop preview"
                className="max-h-[60vh] object-contain"
                onLoad={onImageLoad}
                ref={imageRef}
                src={previewUrl}
              />
            </ReactCrop>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button disabled={saving} type="button" variant="ghost">
              {t('cancel')}
            </Button>
          </DialogClose>
          <Button disabled={saving} loading={saving} onClick={handleCrop} type="button" variant="brand">
            {t('saveAvatar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (trigger) {
    return (
      <>
        <div {...getRootProps()} className={cn('w-fit', !disabled && 'cursor-pointer')}>
          {trigger}
          <input {...getInputProps()} />
        </div>
        {cropDialog}
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative size-24 shrink-0">
          <Avatar className="size-24 rounded-2xl border shadow-2xs ring-0 ring-ring/20 transition-all group-hover:ring-4">
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
            <CameraIcon className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <input {...getInputProps()} />
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" type="button" variant="outline" {...getRootProps()} className="w-fit" disabled={disabled}>
            <UploadCloudIcon className="mr-2 size-4" />
            {value ? t('changeAvatar') : t('uploadAvatar')}
          </Button>

          {value && onRemove && (
            <Button
              className="w-fit text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={disabled}
              onClick={onRemove}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2Icon className="mr-2 size-4" />
              {t('remove')}
            </Button>
          )}
        </div>
      </div>

      {cropDialog}
    </>
  )
}
