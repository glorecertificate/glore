import { type SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

export type * from 'supabase/types'
export interface AuthClient extends SupabaseAuthClient {}
