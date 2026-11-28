'use client'

import { useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { useI18n } from '@/components/providers/i18n'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const ArticleLanguageTabs = ({ className, ...props }: React.ComponentProps<typeof TabsList>) => {
  const t = useTranslations('CourseEditor')
  const { localeItems } = useI18n()
  const { status } = useArticle()

  return (
    <TabsList className={cn('min-w-0 max-sm:w-full', className)} {...props}>
      {localeItems.map(({ label, value }) => {
        const { hasUpdates, published } = status[value]

        return (
          <TabsTrigger className="gap-2" key={value} size="sm" value={value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn('size-1.5 shrink-0 rounded-full', published ? 'bg-success' : 'bg-border-strong')}
                  />
                  {label}
                  {hasUpdates && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />}
                  <span className="sr-only">
                    {published ? t('publishSwitchPublished') : t('publishSwitchDraft')}
                    {hasUpdates && `, ${t('unsavedChanges')}`}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {published ? t('publishSwitchPublished') : t('publishSwitchDraft')}
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
