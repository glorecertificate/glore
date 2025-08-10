import type { Database } from 'supabase/types'

export type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type TableName = keyof PublicSchema['Tables']
