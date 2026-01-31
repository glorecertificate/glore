export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL

export type StorageFile = '/email/logo.png'

export const storageFile = (file: StorageFile) => `${STORAGE_URL}${file}`

export const publicFile = (file: PublicFile) => file
