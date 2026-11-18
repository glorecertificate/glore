'use client'

import { createContext, use, useState } from 'react'

import { useReturnFocus } from '@/hooks/use-return-focus'

type AdminDialogName = 'create' | 'invite'

interface AdminDialogContextValue {
  close: () => void
  current: AdminDialogName | null
  open: (name: AdminDialogName) => void
  remember: () => void
  restore: (event: Event, fallback?: () => HTMLElement | null | undefined) => void
}

const AdminDialogContext = createContext<AdminDialogContextValue | null>(null)

export const AdminDialogProvider = ({ children }: React.PropsWithChildren) => {
  const [current, setCurrent] = useState<AdminDialogName | null>(null)
  const { remember, restore } = useReturnFocus()

  const open = (name: AdminDialogName) => {
    remember()
    setCurrent(name)
  }

  return (
    <AdminDialogContext value={{ close: () => setCurrent(null), current, open, remember, restore }}>
      {children}
    </AdminDialogContext>
  )
}

export const useAdminDialog = () => {
  const context = use(AdminDialogContext)
  if (!context) throw new Error('useAdminDialog must be used within AdminDialogProvider')
  return context
}
