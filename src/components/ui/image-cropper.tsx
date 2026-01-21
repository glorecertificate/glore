'use client'

import { type SyntheticEvent, useCallback, useRef, useState } from 'react'

import { Trash2Icon, UploadCloudIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog'

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
  onChange,
  onRemove,
  value,
}: {
  disabled?: boolean
  onChange?: (file: File) => void
  onRemove?: () => void
  value?: string | null
}) => {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imageRef = useRef<HTMLImageElement | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setOpen(true)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled,
  })

  const onImageLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height))
  }, [])

  const handleCrop = useCallback(async () => {
    if (imageRef.current && completedCrop?.width && completedCrop?.height && selectedFile) {
      try {
        const blob = await getCroppedImage(imageRef.current, completedCrop)
        const file = new File([blob], selectedFile.name, { type: 'image/png' })
        onChange?.(file)
        setOpen(false)
        setPreviewUrl(null)
      } catch (e) {
        console.error(e)
      }
    }
  }, [completedCrop, onChange, selectedFile])

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative">
          <Avatar className="h-24 w-24 cursor-pointer rounded-xl ring-2 ring-border ring-offset-2 transition-opacity hover:opacity-90">
            <AvatarImage className="object-cover" src={value || undefined} />
            <AvatarFallback className="text-lg">{'?'}</AvatarFallback>
          </Avatar>
          <div {...getRootProps()} className="absolute inset-0 z-10 cursor-pointer rounded-xl" />
          <input {...getInputProps()} />
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" type="button" variant="outline" {...getRootProps()} className="w-fit" disabled={disabled}>
            <UploadCloudIcon className="mr-2 h-4 w-4" />
            {'Change Avatar'}
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
              <Trash2Icon className="mr-2 h-4 w-4" />
              {'Remove'}
            </Button>
          )}
        </div>
      </div>

      <Dialog
        onOpenChange={open => {
          setOpen(open)
          if (!open) {
            setPreviewUrl(null)
            setSelectedFile(null)
          }
        }}
        open={open}
      >
        <DialogContent className="sm:max-w-md">
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
              <Button type="button" variant="ghost">
                {'Cancel'}
              </Button>
            </DialogClose>
            <Button onClick={handleCrop} type="button">
              {'Save Avatar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
