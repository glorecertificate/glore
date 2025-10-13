import { useCallback, useMemo, useState } from 'react'

import { generateReactHelpers } from '@uploadthing/react'
import { toast } from 'sonner'
import { type ClientUploadedFileData, type FileRouter, type UploadFilesOptions } from 'uploadthing/types'
import { ZodError } from 'zod'

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>

interface UseFileUploadProps<T extends FileRouter = FileRouter>
  extends Pick<UploadFilesOptions<T['editorUploader']>, 'headers' | 'skipPolling'> {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: unknown) => void
}

/**
 * Hook to manage file uploads using UploadThing.
 *
 * It provides methods to upload files, track progress, and handle completion or errors.
 */
export const useFileUpload = <T extends FileRouter = FileRouter>({
  onUploadComplete,
  onUploadError,
  headers,
}: UseFileUploadProps = {}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>()
  const [uploadingFile, setUploadingFile] = useState<File>()
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const { uploadFiles, useUploadThing } = useMemo(() => generateReactHelpers<T>(), [])

  const uploadThing = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setUploadingFile(file)

      try {
        const [uploaded] = await uploadFiles('editorUploader', {
          headers,
          files: [file],
          onUploadProgress: ({ progress }) => {
            setProgress(Math.min(progress, 100))
          },
        } as UploadFilesOptions<T['editorUploader']>)

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
    },
    [headers, onUploadComplete, onUploadError, uploadFiles]
  )

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadFiles,
    uploadingFile,
    useUploadThing,
  }
}
