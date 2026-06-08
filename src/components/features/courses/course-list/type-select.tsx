'use client'

import { cva } from 'class-variance-authority'
import { useTranslations } from 'next-intl'

import { useCourseListSkillGroups, useCourseListTypes } from '@/components/features/courses/course-list/use-params'
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
      intro:
        'border-[oklch(0.52_0.17_255)]/25 bg-[oklch(0.52_0.17_255)]/10 text-[oklch(0.52_0.17_255)] dark:border-[oklch(0.72_0.15_255)]/25 dark:bg-[oklch(0.72_0.15_255)]/10 dark:text-[oklch(0.72_0.15_255)]',
      learner:
        'border-[oklch(0.5_0.18_305)]/25 bg-[oklch(0.5_0.18_305)]/10 text-[oklch(0.5_0.18_305)] dark:border-[oklch(0.72_0.16_305)]/25 dark:bg-[oklch(0.72_0.16_305)]/10 dark:text-[oklch(0.72_0.16_305)]',
      skill:
        'border-[oklch(0.55_0.15_150)]/25 bg-[oklch(0.55_0.15_150)]/10 text-[oklch(0.55_0.15_150)] dark:border-[oklch(0.76_0.15_150)]/25 dark:bg-[oklch(0.76_0.15_150)]/10 dark:text-[oklch(0.76_0.15_150)]',
    },
  },
})

export const courseIconVariants = cva('', {
  compoundVariants: [
    {
      background: true,
      className:
        'bg-[oklch(0.52_0.17_255)]/12 hover:bg-[oklch(0.52_0.17_255)]/20! aria-expanded:bg-[oklch(0.52_0.17_255)]/20! dark:bg-[oklch(0.72_0.15_255)]/12 dark:hover:bg-[oklch(0.72_0.15_255)]/20! dark:aria-expanded:bg-[oklch(0.72_0.15_255)]/20!',
      type: 'intro',
    },
    {
      background: true,
      className:
        'bg-[oklch(0.5_0.18_305)]/12 hover:bg-[oklch(0.5_0.18_305)]/20! aria-expanded:bg-[oklch(0.5_0.18_305)]/20! dark:bg-[oklch(0.72_0.16_305)]/12 dark:hover:bg-[oklch(0.72_0.16_305)]/20! dark:aria-expanded:bg-[oklch(0.72_0.16_305)]/20!',
      type: 'learner',
    },
    {
      background: true,
      className:
        'bg-[oklch(0.55_0.15_150)]/12 hover:bg-[oklch(0.55_0.15_150)]/20! aria-expanded:bg-[oklch(0.55_0.15_150)]/20! dark:bg-[oklch(0.76_0.15_150)]/12 dark:hover:bg-[oklch(0.76_0.15_150)]/20! dark:aria-expanded:bg-[oklch(0.76_0.15_150)]/20!',
      type: 'skill',
    },
  ],
  defaultVariants: {
    background: false,
  },
  variants: {
    background: {
      false: '',
      true: '',
    },
    type: {
      intro: 'text-[oklch(0.52_0.17_255)] dark:text-[oklch(0.72_0.15_255)]',
      learner: 'text-[oklch(0.5_0.18_305)] dark:text-[oklch(0.72_0.16_305)]',
      skill: 'text-[oklch(0.55_0.15_150)] dark:text-[oklch(0.76_0.15_150)]',
    },
  },
})

export const CourseListTypeSelect = (
  props: Omit<React.ComponentProps<typeof MultiSelect>, 'onChange' | 'options' | 'value'>
) => {
  const t = useTranslations('Courses')
  const { activeTypes, setActiveTypes } = useCourseListTypes()
  const { setActiveSkillGroups } = useCourseListSkillGroups()

  const items = COURSE_TYPES.map(type => ({
    label: t(`courseType-${type}`),
    value: type,
  }))

  const activeItems = items.filter(type => activeTypes.includes(type.value))

  const onTypeChange = (values: string[]) => {
    const typedValues = values as EnumType<'course_type'>[]
    if (typedValues.includes('skill') && !activeTypes.includes('skill')) {
      setActiveSkillGroups(null)
    }
    setActiveTypes(typedValues)
  }

  return (
    <MultiSelect
      label={t('courseType')}
      min={1}
      onChange={onTypeChange}
      options={COURSE_TYPES}
      value={activeTypes}
      {...props}
    >
      <MultiSelectTrigger position="start">
        {activeItems.map(({ label, value }) => (
          <MultiSelectBadge
            className={cn('py-0.75 text-xs font-medium', courseTypeVariants({ type: value }))}
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
        {items.map(({ label, value }) => (
          <MultiSelectItem key={value} value={value}>
            {label}
          </MultiSelectItem>
        ))}
      </MultiSelectContent>
    </MultiSelect>
  )
}
