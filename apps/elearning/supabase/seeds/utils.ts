import { type PostgrestSingleResponse, type UserResponse } from '@supabase/supabase-js'

import { log, pickRandom, pluralize, randomRange } from '@repo/utils'

import { pg } from 'supabase/seeds/config'
import { locales, user } from 'supabase/seeds/data'
import { type Database, type Enums } from 'supabase/types'

type PublicTable = keyof Database['public']['Tables']

export const supaEnv = (key: string) => process.env[`SUPABASE_${key}`] || process.env[`NEXT_PUBLIC_SUPABASE_${key}`]

export const resetDatabase = async () => {
  const publicTables = (
    await pg.query<{
      table_name: string
    }>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  ).rows.map(table => `public.${table.table_name}`)

  await pg.query('TRUNCATE auth.users CASCADE')
  await pg.query(`TRUNCATE ${publicTables.join(', ')} RESTART IDENTITY CASCADE`)
}

export const emailToRole = (email?: string) => email?.split('@')[0]

export const randomUserDetails = () => {
  const sex = pickRandom(user.sex) as Enums<'sex'>
  const gender = ['male', 'female'].includes(sex) ? (sex as 'male' | 'female') : undefined
  const pronouns =
    sex === 'male'
      ? 'he/him'
      : sex === 'female'
        ? 'she/her'
        : sex === 'non-binary'
          ? pickRandom(user.pronouns)
          : undefined

  return { sex, pronouns, gender }
}

export const logEntities = <T>(entities: Partial<Record<PublicTable, T[]>>) => {
  const entity = Object.keys(entities)[0] as PublicTable
  const list = entities[entity]!
  if (list.length === 0) return log.error(`No ${entity} created`)
  log.success(`Created ${list.length} ${pluralize(entity, list.length)}`)
}

export const randomLocales = () => randomRange(locales, 0, 3) as Enums<'locale'>[]

export const pickLocales = (record: Record<Enums<'locale'>, string>, locales: Enums<'locale'>[]) => {
  const obj = Object.entries(record).reduce(
    (obj, [locale, value]) => (locales.includes(locale as Enums<'locale'>) ? { ...obj, [locale]: value } : obj),
    {},
  )
  return Object.keys(obj).length ? (obj as Record<Enums<'locale'>, string>) : record
}

export const createIncludes = (args: string[]) => (arg: string) =>
  args.filter(arg => !arg.startsWith('--')).length === 0 || args.includes(arg) || args.includes(`${arg}s`)

export const verifyResponse = <T>(response: PostgrestSingleResponse<T> | UserResponse, table?: PublicTable) => {
  const hasData = Array.isArray(response.data) ? response.data.length > 0 : !!response.data
  if (hasData && !response.error) return
  if (response.error) throw response.error
  throw new Error(`Can't create ${table}`)
}
