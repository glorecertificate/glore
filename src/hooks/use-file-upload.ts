'use client'

import { useCallback, useState } from 'react'

import { toast } from 'sonner'

export interface UploadedFile {
  url: string
  pathname: string
  contentType: string | undefined
}

interface UseFileUploadOptions {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: unknown) => void
}

export const useFileUpload = ({ onUploadComplete, onUploadError }: UseFileUploadOptions = {}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>()
  const [uploadingFile, setUploadingFile] = useState<File>()
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setUploadingFile(file)
      setProgress(0)

      try {
        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!response.ok) throw new Error('Upload failed')

        setProgress(100)
        const uploaded = (await response.json()) as UploadedFile

        setUploadedFile(uploaded)
        onUploadComplete?.(uploaded)

        return uploaded
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong, please try again later.'
        toast.error(message)
        onUploadError?.(error)
      } finally {
        setProgress(0)
        setIsUploading(false)
        setUploadingFile(undefined)
      }
    },
    [onUploadComplete, onUploadError]
  )

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile,
    uploadingFile,
  }
}
