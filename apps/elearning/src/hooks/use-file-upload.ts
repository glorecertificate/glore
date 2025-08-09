import { useState } from 'react'

import { generateReactHelpers } from '@uploadthing/react'
import { toast } from 'sonner'
import type { ClientUploadedFileData, UploadFilesOptions } from 'uploadthing/types'
import { ZodError } from 'zod'

import type { OurFileRouter } from '@/lib/uploader'

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>

interface UseFileUploadProps
  extends Pick<
    UploadFilesOptions<OurFileRouter['editorUploader']>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: unknown) => void
}

/**
 * Hook to manage file uploads using UploadThing.
 *
 * It provides methods to upload files, track progress, and handle completion or errors.
 */
export const useFileUpload = ({ onUploadComplete, onUploadError, ...props }: UseFileUploadProps = {}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>()
  const [uploadingFile, setUploadingFile] = useState<File>()
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const uploadThing = async (file: File) => {
    setIsUploading(true)
    setUploadingFile(file)

    try {
      const [uploaded] = await uploadFiles('editorUploader', {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100))
        },
      })

      setUploadedFile(uploaded)
      onUploadComplete?.(uploaded)

      return uploaded
    } catch (error) {
      const message =
        error instanceof ZodError
          ? error.issues.map(issue => issue.message).join('\n')
          : error instanceof Error
            ? error.message
            : 'Something went wrong, please try again later.'

      toast.error(message)

      onUploadError?.(error)
    } finally {
      setProgress(0)
      setIsUploading(false)
      setUploadingFile(undefined)
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  }
}

export const { uploadFiles, useUploadThing } = generateReactHelpers<OurFileRouter>()
