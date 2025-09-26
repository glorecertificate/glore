import { createUploadthing, type FileRouter } from 'uploadthing/next'

const createUploader = createUploadthing()

export const fileRouter = {
  editorUploader: createUploader(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.ufsUrl,
    })),
} satisfies FileRouter
