'use client'

import { useTranslations } from 'next-intl'

import { SkillGroupDialog } from '@/components/features/courses/skill-framework/group-dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

export const SkillFrameworkActions = () => {
  const t = useTranslations('Learning.framework')

  return (
    <SkillGroupDialog>
      <Button variant="band">
        <LucideIcon className="size-4" name="plus" />
        {t('addGroup')}
      </Button>
    </SkillGroupDialog>
  )
}
