'use client'

import { useState } from 'react'

import { toast } from 'sonner'

interface UploadedFile {
  url: string
  pathname: string
  contentType: string | undefined
}

/**
 * Hook for uploading files to the server. It provides the current upload progress, the uploaded file information, and functions to initiate the upload process.
 */
export const useFileUpload = ({
  onComplete,
  onError,
}: {
  onComplete?: (file: UploadedFile) => void
  onError?: (error: unknown) => void
} = {}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile>()
  const [file, setFile] = useState<File>()
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (body: File) => {
    setIsUploading(true)
    setFile(file)
    setProgress(0)
    try {
      const response = await fetch('/api/v1/upload', { method: 'POST', headers: { 'Content-Type': body.type }, body })
      if (!response.ok) throw new Error('Upload failed')
      setProgress(100)
      const uploaded = (await response.json()) as UploadedFile
      setUploadedFile(uploaded)
      onComplete?.(uploaded)
      return uploaded
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong, please try again later.'
      toast.error(message)
      onError?.(error)
    } finally {
      setProgress(0)
      setIsUploading(false)
      setFile(undefined)
    }
  }

  return {
    file,
    isUploading,
    progress,
    uploadedFile,
    uploadFile,
  }
}
