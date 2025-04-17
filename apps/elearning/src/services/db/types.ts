import { type AnyArray, type Primitive } from '@repo/utils'

import { type IntlRecord } from '@/services/i18n'
import { type Database, type Tables } from 'supabase/types'

export type * from 'supabase/types'

export type IntlTables<T extends keyof Database[Extract<keyof Database, 'public'>]['Tables']> = {
  [K in keyof Tables<T>]: Tables<T>[K] extends AnyArray
    ? IntlTables<Tables<T>[K][number]>[]
    : Tables<T>[K] extends Primitive
      ? Tables<T>[K]
      : IntlRecord
}
