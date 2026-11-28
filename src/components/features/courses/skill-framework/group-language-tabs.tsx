'use client'

import { useTranslations } from 'next-intl'

import { useI18n } from '@/components/providers/i18n'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface GroupLanguageStatus {
  complete: boolean
  hasUpdates: boolean
}

interface GroupLanguageTabsProps {
  className?: string
  status: Record<string, GroupLanguageStatus>
}

export const GroupLanguageTabs = ({ className, status }: GroupLanguageTabsProps) => {
  const t = useTranslations('Learning.framework')
  const { localeItems } = useI18n()

  return (
    <TabsList className={cn('min-w-0', className)}>
      {localeItems.map(({ label, value }) => {
        const { complete, hasUpdates } = status[value]

        return (
          <TabsTrigger className="gap-2" key={value} size="sm" value={value}>
            <span
              aria-hidden
              className={cn('size-2 shrink-0 rounded-full', complete ? 'bg-success' : 'bg-border-strong')}
              data-slot="status-dot"
            />
            {label}
            {hasUpdates && (
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-warning" data-slot="updates-dot" />
            )}
            <span className="sr-only">
              {complete ? t('statusComplete') : t('statusIncomplete')}
              {hasUpdates && `, ${t('statusUnsaved')}`}
            </span>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
