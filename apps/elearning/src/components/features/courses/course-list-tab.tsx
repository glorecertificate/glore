'use client'

import { useMemo } from 'react'

import { ArchiveIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type CourseListView } from '@/lib/navigation'

export const CourseListTab = ({ count, value }: { active: boolean; count: number; value: CourseListView }) => {
  const t = useTranslations('Courses')

  const archiveTooltip = useMemo(() => {
    if (value !== 'archived') return null
    if (count === 0) return t('archive')
    return (
      <span className="flex items-center gap-1">
        {t('archive')}
        <small className="text-background/70 leading-0">{count}</small>
      </span>
    )
  }, [count, t, value])

  if (value === 'archived')
    return (
      <TabsTrigger className="rounded-xl p-0" value={value}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <span className="inline-block px-3.5">
              <ArchiveIcon />
            </span>
          </TooltipTrigger>
          <TooltipContent arrow={false} sideOffset={10}>
            {archiveTooltip}
          </TooltipContent>
        </Tooltip>
      </TabsTrigger>
    )

  return (
    <TabsTrigger className="rounded-xl" count={count} value={value}>
      {t(value)}
    </TabsTrigger>
  )
}
