'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

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
      <Button
        aria-label={t('moveUp')}
        disabled={!canMoveUp || busy}
        onClick={() => move('up')}
        size="icon"
        variant="ghost"
      >
        <LucideIcon className="size-4" name="arrow-up" />
      </Button>
      <Button
        aria-label={t('moveDown')}
        disabled={!canMoveDown || busy}
        onClick={() => move('down')}
        size="icon"
        variant="ghost"
      >
        <LucideIcon className="size-4" name="arrow-down" />
      </Button>
      <SkillGroupDialog group={group}>
        <Button aria-label={t('edit')} size="icon" variant="ghost">
          <LucideIcon className="size-4" name="pencil" />
        </Button>
      </SkillGroupDialog>
      <Button aria-label={t('delete')} onClick={() => setConfirming(true)} size="icon" variant="ghost">
        <LucideIcon className="size-4" name="trash-2" />
      </Button>
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
