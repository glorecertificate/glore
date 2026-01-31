'use client'

import type React from 'react'
import { memo, useCallback, useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCourseListSkillGroups, useCourseListTypes } from '@/components/features/courses/list/use-params'
import { useCourses } from '@/components/providers/courses-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const CourseListGroupSelect = memo(({ ...props }: React.ComponentProps<typeof DropdownMenu>) => {
  const t = useTranslations('Courses')

  const { skillGroups } = useCourses()
  const { activeTypes } = useCourseListTypes()
  const { activeSkillGroups, setActiveSkillGroups, defaultSkillGroups } = useCourseListSkillGroups()

  const [toastTime, setToastTime] = useState<number | null>(null)

  const toggleGroup = useCallback(
    (groupValue: string) => {
      if (activeSkillGroups.includes(groupValue)) {
        if (activeSkillGroups.length <= 1) {
          if (toastTime && Date.now() - toastTime < 2000) return
          toast.info(t('selectAtLeastOneGroup'))
          setToastTime(Date.now())
          return
        }
        setActiveSkillGroups(activeSkillGroups.filter(g => g !== groupValue))
        return
      }
      setActiveSkillGroups([...activeSkillGroups, groupValue])
    },
    [activeSkillGroups, setActiveSkillGroups, t, toastTime]
  )

  const selectAll = useCallback(() => {
    setActiveSkillGroups(defaultSkillGroups)
  }, [defaultSkillGroups, setActiveSkillGroups])

  if (!activeTypes.includes('skill')) return null

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button className="font-normal text-[13.5px]" variant="outline">
          <span className="flex flex-1 items-center gap-1.5">
            {t('skillGroup')}
            <span className="text-[13px] text-muted-foreground/70">
              {'('}
              {activeSkillGroups.length}
              {'/'}
              {skillGroups.length}
              {')'}
            </span>
          </span>
          <ChevronDownIcon className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={e => e.preventDefault()}>
        {skillGroups.map(({ id, label, value }) => (
          <DropdownMenuCheckboxItem
            checked={activeSkillGroups.includes(value)}
            className="cursor-pointer pr-3"
            key={id}
            onCheckedChange={() => toggleGroup(value)}
            onSelect={e => e.preventDefault()}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
        {activeSkillGroups.length < skillGroups.length && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              className="cursor-pointer"
              onCheckedChange={selectAll}
              onSelect={e => e.preventDefault()}
            >
              {t('selectAllGroups')}
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
