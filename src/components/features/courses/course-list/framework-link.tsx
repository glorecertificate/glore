'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export const CourseListFrameworkLink = () => {
  const t = useTranslations('Learning.editor')

  return (
    <Button asChild size="sm" variant="outline">
      <Link href="/courses/skills">
        <LucideIcon className="size-4" name="layers" />
        {t('frameworkLink')}
      </Link>
    </Button>
  )
}
