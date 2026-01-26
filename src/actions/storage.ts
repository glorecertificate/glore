'use server'

import 'server-only'

import { getAuthUser } from '@/actions/auth'
import { getDatabase } from '@/db/client'

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL

export const uploadAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file uploaded')

  const db = await getDatabase()

  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  const { data, error } = await db.storage.from('avatars').upload(fileName, file, { upsert: true })
  if (error) throw error

  return `${STORAGE_URL}/avatars/${data.path}`
}
