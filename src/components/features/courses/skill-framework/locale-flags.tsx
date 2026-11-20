'use client'

import { useI18n } from '@/components/providers/i18n'

export const LocaleFlags = ({ languages }: { languages: string[] }) => {
  const { localeItems } = useI18n()
  const items = localeItems.filter(item => languages.includes(item.value))
  if (items.length === 0) return null

  return (
    <ul className="flex items-center gap-1 leading-none" data-slot="locale-flags">
      {items.map(item => (
        <li key={item.value}>
          <span aria-hidden>{item.icon}</span>
          <span className="sr-only">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
