'use client'

import { useRef } from 'react'

import { LanguageSelect } from '@/components/ui/language-select'
import { cn } from '@/lib/utils'

export const AuthLanguageSelect = ({ className }: { className?: string }) => {
  const languageChanged = useRef(false)

  const onCloseAutoFocus = (event: Event) => {
    if (!languageChanged.current) return
    languageChanged.current = false
    const main = document.querySelector('[data-slot="auth-main"]')
    if (!main) return
    const [username, password] = ['username', 'password'].map(name =>
      main.querySelector<HTMLInputElement>(`input[name="${name}"]`)
    )
    if (!username || !password) return
    event.preventDefault()
    const emptyField = [username, password].find(field => !field.value)
    if (emptyField) return emptyField.focus()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  return (
    <LanguageSelect
      className={cn('min-w-28', className)}
      contentProps={{ className: 'data-[state=open]:transition-none', onCloseAutoFocus }}
      onChange={() => {
        languageChanged.current = true
      }}
    />
  )
}
