'use client'

import { memo } from 'react'

import { RotateCcwIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useCourseListFilters } from '@/components/features/courses/list/use-params'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const CourseListFilterReset = memo((props: React.ComponentProps<typeof Button>) => {
  const t = useTranslations('Courses')

  const { resetFilters, hasFilters } = useCourseListFilters()

  if (!hasFilters) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={resetFilters} size="sm" variant="ghost" {...props}>
          <RotateCcwIcon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('resetAllFilters')}</TooltipContent>
    </Tooltip>
  )
})
