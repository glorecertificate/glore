import { createRouteHandler, createUploadthing } from 'uploadthing/next'

export const { GET, POST } = createRouteHandler({
  router: {
    editorUploader: createUploadthing()(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
      .middleware(() => ({}))
      .onUploadComplete(({ file }) => ({
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.ufsUrl,
      })),
  },
})
