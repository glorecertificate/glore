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

  const modulePath = useMemo(
    () =>
      dynamicRoute(Route.Module, {
        slug: module.skill.slug,
      }),
    [module.skill.slug],
  )

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

  const progressColor = useMemo(() => (module.status === ModuleStatus.Completed ? 'success' : 'default'), [module.status])
  const buttonColor = useMemo(() => {
    switch (module.status) {
      case ModuleStatus.NotStarted:
        return 'default'
      case ModuleStatus.InProgress:
        return 'secondary'
      case ModuleStatus.Completed:
        return 'primary'
    }
  }, [module.status])
  const buttonVariant = useMemo(() => (module.status === ModuleStatus.NotStarted ? 'outline' : 'default'), [module.status])

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
    <Card className="flex h-full flex-col justify-between gap-0 overflow-hidden pt-0">
      <div>
        <div className="relative h-48 w-full">
          <Link href={modulePath}>
            <Image alt={module.title} className="object-cover" fill src={module.image_url || Asset.Placeholder} />
          </Link>
        </div>
        <CardHeader className="py-4">
          <Link href={modulePath}>
            <h3 className="text-lg font-semibold">{module.title}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </CardHeader>
        <CardContent className="flex-1">
          {module.skill.subskills.length && (
            <>
              <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase">{t('Common.topics')}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {module.skill.subskills.slice(0, 4).map(subskill => (
                  <Badge className="flex items-center text-[11px]" color="secondary" key={subskill.id}>
                    {capitalize(subskill.name)}
                  </Badge>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {moduleDifficulty && (
              <Badge className="text-xs" color="muted" variant="outline">
                {moduleDifficulty}
              </Badge>
            )}
            {moduleDuration && (
              <Badge className="flex items-center text-xs" color="muted" variant="outline">
                <ClockIcon className="mr-1 h-3 w-3" />
                {moduleDuration}
              </Badge>
            )}
          </div>
        </CardContent>
      </div>
      <CardFooter className="flex-col gap-4">
        {module.status !== ModuleStatus.NotStarted && (
          <div className="w-full">
            <div className="mt-6 mb-1 flex items-center justify-between text-sm text-muted-foreground">
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
            <Progress className="h-1.5" color={progressColor} value={module.progress} />
          </div>
        )}
        <Link className="w-full" href={modulePath}>
          <Button className="w-full" color={buttonColor} variant={buttonVariant}>
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
