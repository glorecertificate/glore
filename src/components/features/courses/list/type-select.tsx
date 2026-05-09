'use client'

import { memo, useCallback, useMemo } from 'react'

import { cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { useCourseListSkillGroups, useCourseListTypes } from '@/components/features/courses/list/use-params'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { COURSE_TYPES } from '@/db/queries/course'
import { type EnumType } from '@/db/types'
import { cn } from '@/lib/utils'

export const courseTypeVariants = cva('border', {
  variants: {
    type: {
      intro: 'border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-400',
      learner: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      skill: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
  },
})

export const CourseListTypeSelect = memo(
  (props: Omit<React.ComponentProps<typeof MultiSelect>, 'onChange' | 'options' | 'value'>) => {
    const t = useTranslations('Courses')
    const { activeTypes, setActiveTypes } = useCourseListTypes()
    const { setActiveSkillGroups } = useCourseListSkillGroups()

    const typeItems = useMemo(
      () =>
        COURSE_TYPES.map(type => ({
          label: t(`courseType-${type}`),
          value: type,
        })),
      [t]
    )

    const handleChange = useCallback(
      (values: string[]) => {
        const typedValues = values as EnumType<'course_type'>[]
        if (typedValues.includes('skill') && !activeTypes.includes('skill')) {
          setActiveSkillGroups(null)
        }
        setActiveTypes(typedValues)
      },
      [activeTypes, setActiveSkillGroups, setActiveTypes]
    )

    return (
      <MultiSelect
        label={t('courseType')}
        min={1}
        onChange={handleChange}
        options={COURSE_TYPES}
        value={activeTypes}
        {...props}
      >
        <MultiSelectTrigger position="start">
          {typeItems
            .filter(type => activeTypes.includes(type.value))
            .map(({ label, value }) => (
              <MultiSelectBadge
                className={cn('py-1 text-xs font-medium', courseTypeVariants({ type: value }))}
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
