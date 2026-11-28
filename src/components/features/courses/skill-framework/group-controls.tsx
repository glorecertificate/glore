'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteSkillGroup, moveSkillGroup } from '@/actions/courses/skill-groups'
import { SkillGroupDialog, type SkillGroupDraft } from '@/components/features/courses/skill-framework/group-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'

export const SkillGroupControls = ({
  canMoveDown,
  canMoveUp,
  group,
}: {
  canMoveDown: boolean
  canMoveUp: boolean
  group: SkillGroupDraft
}) => {
  const t = useTranslations('Learning.framework')
  const { refresh } = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const move = (direction: 'down' | 'up') => {
    setBusy(true)
    startTransition(async () => {
      const result = await moveSkillGroup({ direction, id: group.id })
      setBusy(false)
      if ('error' in result) {
        toast.error(t('moveError'))
        return
      }
      refresh()
    })
  }

  const remove = () => {
    setBusy(true)
    startTransition(async () => {
      const result = await deleteSkillGroup(group.id)
      setBusy(false)
      setConfirming(false)
      if ('error' in result) {
        toast.error(result.error.code === 'IN_USE' ? t('deleteInUse') : t('deleteError'))
        return
      }
      toast.success(t('deleted'))
      refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <SkillGroupDialog group={group} onOpenChange={setEditing} open={editing}>
        <Button className="max-sm:hidden" variant="outline">
          {t('editGroup')}
        </Button>
      </SkillGroupDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={t('groupActions')} disabled={busy} size="icon" variant="ghost">
            <LucideIcon name="ellipsis" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem className="sm:hidden" onSelect={() => setEditing(true)}>
            <LucideIcon aria-hidden name="pencil" />
            {t('editGroup')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveUp} onSelect={() => move('up')}>
            <LucideIcon aria-hidden name="arrow-up" />
            {t('moveUp')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveDown} onSelect={() => move('down')}>
            <LucideIcon aria-hidden name="arrow-down" />
            {t('moveDown')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirming(true)} variant="destructive">
            <LucideIcon aria-hidden name="trash-2" />
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog onOpenChange={setConfirming} open={confirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} variant="destructive">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
