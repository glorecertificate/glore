'use client'

import { useCallback } from 'react'

import type { UserAttributes, VerifyOtpParams } from '@supabase/supabase-js'

import { useDatabase } from '@/hooks/use-database'

export const useAuth = () => {
  const db = useDatabase()

  const verifyOtp = useCallback(
    async (params: VerifyOtpParams) => {
      const { data, error } = await db.auth.verifyOtp(params)
      if (error) throw error
      return data.user
    },
    [db]
  )

  const updateUser = useCallback(
    async (attributes: UserAttributes) => {
      const { data, error } = await db.auth.updateUser(attributes)
      if (error) throw error
      return data.user
    },
    [db]
  )

  return {
    auth: db.auth,
    verifyOtp,
    updateUser,
  }
}
