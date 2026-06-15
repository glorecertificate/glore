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

export const courseTypeVariants = cva('rounded-xl border text-stroke-0.25', {
  variants: {
    type: {
      intro: 'bg-accent text-muted-foreground',
      learner: 'border-brand-accent/40 bg-brand/10 text-brand-accent',
      skill: 'border-brand-tertiary/25 bg-brand-tertiary/10 text-brand-tertiary',
    },
  },
})

export const courseIconVariants = cva('', {
  compoundVariants: [
    {
      type: 'intro',
      background: true,
      className: 'bg-muted-foreground/12 hover:bg-muted-foreground/20! aria-expanded:bg-muted-foreground/20!',
    },
    {
      type: 'learner',
      background: true,
      className: 'bg-brand/12 hover:bg-brand/20! aria-expanded:bg-brand/20!',
    },
    {
      type: 'skill',
      background: true,
      className: 'bg-brand-tertiary/12 hover:bg-brand-tertiary/20! aria-expanded:bg-brand-tertiary/20!',
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
      intro: 'text-muted-foreground',
      learner: 'text-brand',
      skill: 'text-brand-tertiary',
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
            className={cn('py-0.75 text-xs', courseTypeVariants({ type: value }))}
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
