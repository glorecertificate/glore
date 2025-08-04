'use client'

import { useEffect } from 'react'

import { LoginForm } from '@/components/features/auth/login-form'
import { cookies } from '@/lib/storage/client'

export default () => {
  useEffect(() => {
    cookies.deleteAll()
  })

  return <LoginForm />
}
