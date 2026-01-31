'use client'

import type React from 'react'
import { memo, useMemo } from 'react'

import { cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { useCourseListTypes } from '@/components/features/courses/list/use-params'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { COURSE_TYPES } from '@/db/queries/course'
import { type Enums } from '@/db/types'
import { cn } from '@/lib/utils'

export const courseTypeVariants = cva('', {
  variants: {
    type: {
      intro: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
      skill: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      learner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    },
  },
})

export const CourseListTypeSelect = memo(
  (props: Omit<React.ComponentProps<typeof MultiSelect>, 'onChange' | 'options' | 'value'>) => {
    const t = useTranslations('Courses')
    const { activeTypes, setActiveTypes } = useCourseListTypes()

    const typeItems = useMemo(
      () =>
        COURSE_TYPES.map(type => ({
          value: type,
          label: t(`courseType-${type}`),
        })),
      [t]
    )

    return (
      <MultiSelect
        label={t('courseType')}
        min={1}
        onChange={values => setActiveTypes(values as Enums<'course_type'>[])}
        options={COURSE_TYPES}
        value={activeTypes}
        {...props}
      >
        <MultiSelectTrigger position="start">
          {typeItems
            .filter(type => activeTypes.includes(type.value))
            .map(({ label, value }) => (
              <MultiSelectBadge
                className={cn('py-1 font-medium text-xs', courseTypeVariants({ type: value }))}
                key={value}
                label={t('courseType').toLowerCase()}
                value={value}
                variant="ghost"
              >
                {label}
              </MultiSelectBadge>
            ))}
        </MultiSelectTrigger>
        <MultiSelectContent align="start">
          {typeItems.map(({ label, value }) => (
            <MultiSelectItem key={value} value={value}>
              {label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    )
  }
)
