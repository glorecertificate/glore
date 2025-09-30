import { createClient, type PostgrestSingleResponse } from '@supabase/supabase-js'

import development from '@config/development'
import i18n from '@config/i18n'

import { type AuthUserResponse, type Database, type Enums, type PublicTable } from '@/lib/db'

export const seedClient = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const createEdgeClient = (request: Request) =>
  createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: request.headers.get('Authorization')!,
      },
    },
  })

export const seeder = {
  ...development.seeder,
  languages: [...new Set(development.seeder.countries.flatMap(({ languages }) => languages))] as Enums<'locale'>[],
  locales: Object.keys(i18n) as Enums<'locale'>[],
}

export const verifyResponse = <T>(response: PostgrestSingleResponse<T> | AuthUserResponse, table?: PublicTable) => {
  const hasData = Array.isArray(response.data) ? response.data.length > 0 : !!response.data
  if (hasData && !response.error) return
  if (response.error) throw response.error
  throw new Error(`Can't create ${String(table)}`)
}
