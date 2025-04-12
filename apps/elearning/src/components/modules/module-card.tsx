'use client'

import { useMemo } from 'react'

import { ClockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { capitalize } from '@repo/utils'

import { ModuleStatus, type BaseModule } from '@/api/modules'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { dynamicRoute, Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { type Localized } from '@/services/i18n'

interface ModuleCardProps {
  module: Localized<BaseModule>
}

export const ModuleCard = ({ module }: ModuleCardProps) => {
  const t = useTranslations()

  const modulePath = useMemo(() => {
    const params: { step?: string } = {}
    if (module.status === ModuleStatus.InProgress) params.step = String(module.completed_steps + 1)

    return dynamicRoute(
      Route.Module,
      {
        slug: module.skill.slug,
      },
      params,
    )
  }, [module.completed_steps, module.skill.slug, module.status])

  // const moduleDate = useMemo(() => {
  //   const date = new Date(module.updated_at)
  //   const now = new Date()
  //   const diff = Math.abs(now.getTime() - date.getTime())
  //   const diffInDays = Math.floor(diff / (1000 * 3600 * 24))
  //   const diffInMonths = Math.floor(diffInDays / 30)
  //   const diffInYears = Math.floor(diffInDays / 365)

  //   if (diffInYears > 0) return t('Common.updatedYearsAgo', { count: diffInYears })
  //   if (diffInMonths > 0) return t('Common.updatedMonthsAgo', { count: diffInMonths })
  //   if (diffInDays > 1) return t('Common.updatedDaysAgo', { count: diffInDays })
  //   if (diffInDays === 1) return t('Common.updatedYesterday')
  //   return t('Common.updatedToday')
  // }, [module.updated_at, t])

  const moduleDifficulty = useMemo(() => {
    switch (module.difficulty) {
      case 'beginner':
        return t('Modules.difficultyBeginner')
      case 'intermediate':
        return t('Modules.difficultyIntermediate')
      case 'advanced':
        return t('Modules.difficultyAdvanced')
      default:
        return module.difficulty
    }
  }, [module.difficulty, t])

  const moduleDuration = useMemo(() => {
    switch (module.duration) {
      case 'short':
        return t('Modules.durationShort')
      case 'medium':
        return t('Modules.durationMedium')
      case 'long':
        return t('Modules.durationLong')
      default:
        return module.duration
    }
  }, [module.duration, t])

  const actionLabel = useMemo(() => {
    switch (module.status) {
      case ModuleStatus.NotStarted:
        return t('Modules.startModule')
      case ModuleStatus.InProgress:
        return t('Modules.continueModule')
      case ModuleStatus.Completed:
        return t('Modules.reviewModule')
    }
  }, [module.status, t])

  return (
    <Card className="flex h-full flex-col justify-between gap-4 overflow-hidden pt-0">
      <div>
        <div className="relative h-48 w-full">
          <Link href={modulePath} title={t('Modules.startModule')}>
            <Image alt={module.title} className="object-cover" fill src={module.image_url || Asset.Placeholder} />
          </Link>
        </div>
        <CardHeader className="pt-6 pb-4">
          <Link href={modulePath}>
            <h3 className="text-lg font-semibold">{module.title}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="text-xs" color="secondary">
              {module.skill.icon_url && (
                <Image
                  alt={module.skill.slug}
                  className="mr-1 h-3 w-3 rounded-full"
                  height={16}
                  src={module.skill.icon_url}
                  width={16}
                />
              )}
              {module.skill.name}
            </Badge>
            {module.skill.subskills.slice(0, 3).map(subskill => (
              <Badge className="flex items-center text-[9px]" color="secondary.accent" key={subskill.id}>
                {capitalize(subskill.name)}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {moduleDifficulty && (
              <Badge className="text-[11px]" color="muted" variant="outline">
                {moduleDifficulty}
              </Badge>
            )}
            {moduleDuration && (
              <Badge className="flex items-center text-[11px]" color="muted" variant="outline">
                <ClockIcon className="mr-1 h-3 w-3" />
                {moduleDuration}
              </Badge>
            )}
          </div>
          {module.status !== ModuleStatus.NotStarted && (
            <>
              <div className="mt-8 mb-1 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center">
                  {module.completed_steps}
                  {' / '}
                  {module.steps_count}{' '}
                  {t('Common.lessons', {
                    count: module.steps_count,
                  })}
                </span>
                <span>
                  {module.progress}
                  {'% '}
                  {t('Common.completed')}
                </span>
              </div>
              <Progress className="h-1.5" value={module.progress} />
            </>
          )}
        </CardContent>
      </div>
      <CardFooter>
        <Link className="w-full" href={modulePath}>
          <Button className="w-full" variant="outline">
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
