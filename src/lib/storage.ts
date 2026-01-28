export type StorageFile = 'email/logo.png'

export const storageFile = (file: StorageFile) => `${process.env.NEXT_PUBLIC_STORAGE_URL}/${file}`

export const publicFile = (file: PublicFile) => `/${file}`
