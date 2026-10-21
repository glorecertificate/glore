'use client'

import 'react-image-crop/dist/ReactCrop.css'

import { type SyntheticEvent, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import ReactCrop, { type Crop, type PixelCrop, centerCrop } from 'react-image-crop'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'

const OUTPUT_SIZE = 512
const OUTPUT_TYPE = 'image/webp'
const OUTPUT_QUALITY = 0.9

const cropImage = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const sourceWidth = crop.width * scaleX
  const sourceHeight = crop.height * scaleY
  const ratio = Math.min(OUTPUT_SIZE / Math.max(sourceWidth, sourceHeight), 1)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sourceWidth * ratio)
  canvas.height = Math.round(sourceHeight * ratio)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      OUTPUT_TYPE,
      OUTPUT_QUALITY
    )
  })
}

const toFileName = (name: string, type: string) => `${name.replace(/\.[^.]+$/u, '')}.${type.split('/')[1]}`

export const ImageCropDialog = ({
  file,
  onChange,
  onClose,
  previewUrl,
}: {
  file: File
  onChange?: (file: File) => Promise<void> | void
  onClose: () => void
  previewUrl: string
}) => {
  const t = useTranslations('Components.ImageCropper')

  const [saving, setSaving] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const completedRef = useRef<PixelCrop | undefined>(undefined)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const side = Math.min(width, height)
    const nextCrop = centerCrop({ unit: 'px', width: side, height: side, x: 0, y: 0 }, width, height)
    setCrop(nextCrop)
    completedRef.current = nextCrop
  }

  const handleCrop = async () => {
    const completedCrop = completedRef.current
    if (!imageRef.current || !completedCrop?.width || !completedCrop?.height) return
    try {
      setSaving(true)
      const blob = await cropImage(imageRef.current, completedCrop)
      await onChange?.(new File([blob], toFileName(file.name, blob.type), { type: blob.type }))
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={isOpen => !isOpen && onClose()} open>
      <DialogTitle className="hidden" />
      <DialogContent aria-describedby={undefined} className="sm:max-w-2xl">
        <div className="mt-4 flex justify-center">
          <ReactCrop
            aspect={1}
            className="max-h-[70vh]"
            crop={crop}
            onChange={pixelCrop => setCrop(pixelCrop)}
            onComplete={c => {
              completedRef.current = c
            }}
          >
            <img
              alt="Crop preview"
              className="max-h-[70vh] w-auto object-contain"
              onLoad={onImageLoad}
              ref={imageRef}
              src={previewUrl}
            />
          </ReactCrop>
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
}
