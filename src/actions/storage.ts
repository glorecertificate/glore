'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { getAuthUser } from '@/actions/auth'
import { getDatabase } from '@/db/client'
import { resolveQuery } from '@/db/helpers'
import { parseUser, userQuery } from '@/db/queries/user'
import { CacheTag } from '@/lib/cache'

export const uploadAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file uploaded')

  const db = await getDatabase()
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const fileName = `${user.id}-${Date.now()}.png`

  const { error: uploadError } = await db.storage.from('avatars').upload(fileName, buffer, {
    contentType: 'image/png',
    upsert: true,
  })
  if (uploadError) return { error: { ...uploadError } }

  const {
    data: { publicUrl },
  } = db.storage.from('avatars').getPublicUrl(fileName)

  const query = db.from('users').update({ avatar_url: publicUrl }).eq('id', user.id).select(userQuery).single()
  const { data, error } = await resolveQuery(query, parseUser)
  if (error) return { error }

  updateTag(CacheTag.User)
  return { data }
}

export const removeAvatar = async () => {
  const db = await getDatabase()
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const query = db.from('users').update({ avatar_url: null }).eq('id', user.id).select(userQuery).single()
  const { data, error } = await resolveQuery(query, parseUser)
  if (error) return { data: null, error }

  updateTag(CacheTag.User)
  return { data, error: null }
}
