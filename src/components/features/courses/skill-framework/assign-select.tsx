'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'

import { assignSkillGroup } from '@/actions/courses/skill-groups'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'

export const CourseRowMenu = ({
  courseId,
  courseTitle,
  groupId,
  groups,
}: {
  courseId: number
  courseTitle: string
  groupId: number | null
  groups: { id: number; name: string }[]
}) => {
  const t = useTranslations('Learning.framework')
  const { refresh } = useRouter()
  const [busy, setBusy] = useState(false)

  const move = (target: number | null) => {
    setBusy(true)
    startTransition(async () => {
      const result = await assignSkillGroup({ courseId, groupId: target })
      setBusy(false)
      if ('error' in result) {
        toast.error(t('assignError'))
        return
      }
      toast.success(t('assigned'))
      refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('assignLabel', { course: courseTitle })}
          className="ml-auto"
          disabled={busy}
          size="icon"
          variant="ghost"
        >
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LucideIcon aria-hidden name="folder-open" />
            {t('moveToGroup')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {groups.map(group => (
              <DropdownMenuItem disabled={group.id === groupId} key={group.id} onSelect={() => move(group.id)}>
                {group.name}
              </DropdownMenuItem>
            ))}
            {groupId !== null && <DropdownMenuItem onSelect={() => move(null)}>{t('assignNone')}</DropdownMenuItem>}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
