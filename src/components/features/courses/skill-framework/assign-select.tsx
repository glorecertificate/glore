'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { assignSkillGroup } from '@/actions/courses/skill-groups'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NONE = 'none'

export const AssignSkillGroup = ({
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

  const onChange = (value: string) => {
    setBusy(true)
    startTransition(async () => {
      const result = await assignSkillGroup({ courseId, groupId: value === NONE ? null : Number(value) })
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
    <Select disabled={busy} onValueChange={onChange} value={groupId ? String(groupId) : NONE}>
      <SelectTrigger
        aria-label={t('assignLabel', { course: courseTitle })}
        className="w-full whitespace-nowrap sm:w-48"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{t('assignNone')}</SelectItem>
        {groups.map(group => (
          <SelectItem key={group.id} value={String(group.id)}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
