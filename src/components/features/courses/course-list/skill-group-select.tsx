'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useCourseListSkillGroups, useCourseListTypes } from '@/components/features/courses/course-list/use-params'
import { useCourses } from '@/components/providers/courses-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const CourseListGroupSelect = ({ ...props }: React.ComponentProps<typeof DropdownMenu>) => {
  const t = useTranslations('Courses')

  const { skillGroups } = useCourses()
  const { activeTypes, setActiveTypes } = useCourseListTypes()
  const { activeSkillGroups, setActiveSkillGroups: setActiveGroups, defaultSkillGroups } = useCourseListSkillGroups()

  const toggleGroup = (groupValue: string) => {
    if (activeSkillGroups.includes(groupValue)) {
      if (activeSkillGroups.length <= 1) {
        setActiveGroups(null)
        setActiveTypes(activeTypes.filter(type => type !== 'skill'))
        return
      }
      setActiveGroups(activeSkillGroups.filter(g => g !== groupValue))
      return
    }
    setActiveGroups([...activeSkillGroups, groupValue])
  }

  const selectAll = () => {
    setActiveGroups(defaultSkillGroups)
  }

  if (!activeTypes.includes('skill')) {
    return null
  }

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button className="text-[13.5px]" variant="outline">
          <span className="flex flex-1 items-center gap-1.5">
            {t('skillGroup')}
            <span className="text-[13px] leading-[normal] text-muted-foreground/70">
              {activeSkillGroups.length}
              {'/'}
              {skillGroups.length}
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
}
