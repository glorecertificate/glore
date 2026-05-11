'use client'

import 'react-image-crop/dist/ReactCrop.css'

import { type SyntheticEvent, useCallback, useRef, useState } from 'react'

import { Trash2Icon, UploadCloudIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDropzone } from 'react-dropzone'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'

const getCroppedImage = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

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
  value,
}: {
  disabled?: boolean
  fallback?: React.ReactNode
  onChange?: (file: File) => Promise<void> | void
  onRemove?: () => void
  value?: string | null
}) => {
  const t = useTranslations('Components.ImageCropper')

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) {
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setOpen(true)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    disabled,
    maxFiles: 1,
    onDrop,
  })

  const onImageLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height))
  }, [])

  const handleCrop = useCallback(async () => {
    if (imageRef.current && completedCrop?.width && completedCrop?.height && selectedFile) {
      try {
        setSaving(true)
        const blob = await getCroppedImage(imageRef.current, completedCrop)
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
  }, [completedCrop, onChange, selectedFile])

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative">
          <Avatar className="size-24 cursor-pointer rounded-xl border transition-opacity hover:opacity-50">
            <AvatarImage className="object-cover" src={value || undefined} />
            <AvatarFallback className="text-3xl text-muted-foreground">{fallback ?? '?'}</AvatarFallback>
          </Avatar>
          <div {...getRootProps()} className="absolute inset-0 z-10 cursor-pointer rounded-xl" />
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

      <Dialog
        onOpenChange={isOpen => {
          setOpen(isOpen)
          if (!isOpen) {
            setPreviewUrl(null)
            setSelectedFile(null)
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
                onComplete={c => setCompletedCrop(c)}
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
            <Button disabled={saving} loading={saving} onClick={handleCrop} type="button">
              {t('saveAvatar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
