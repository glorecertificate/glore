'use client'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { useI18n } from '@/components/providers/i18n'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { computeTranslationCoverage } from '@/db/queries/course-editing'
import { cn } from '@/lib/utils'

export const CourseLanguageTabs = ({ className, ...props }: React.ComponentProps<typeof TabsList>) => {
  const t = useTranslations('CourseEditor')
  const tEditor = useTranslations('Learning.editor')
  const { localeItems } = useI18n()
  const { course, status } = useCourse()
  const coverage = computeTranslationCoverage(course)

  return (
    <TabsList className={cn('min-w-0 max-sm:w-full', className)} {...props}>
      {localeItems.map(({ label, value }) => {
        const { hasUpdates, published } = status[value]

        return (
          <TabsTrigger className="group/tab gap-2" key={value} size="sm" value={value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn('size-2 shrink-0 rounded-full', published ? 'bg-success' : 'bg-border-strong')}
                  />
                  {label}
                  {hasUpdates && <span aria-hidden className="size-2 shrink-0 rounded-full bg-warning" />}
                  <span
                    aria-hidden
                    className="hidden text-xs max-sm:group-data-[state=inactive]/tab:hidden pointer-coarse:inline"
                  >
                    {`${coverage[value].done}/${coverage[value].total}`}
                  </span>
                  <span className="sr-only">
                    {published ? t('publishSwitchPublished') : t('publishSwitchDraft')}
                    {hasUpdates && `, ${t('unsavedChanges')}`}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-0.5" side="bottom">
                <span>{published ? t('publishSwitchPublished') : t('publishSwitchDraft')}</span>
                <span>
                  {tEditor('coverage', {
                    done: coverage[value].done,
                    language: label,
                    total: coverage[value].total,
                  })}
                </span>
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
