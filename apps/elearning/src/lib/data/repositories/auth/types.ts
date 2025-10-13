import { type EmailOtpType } from '@supabase/supabase-js'

export interface VerifyUserParams {
  token: string
  type: EmailOtpType
}
