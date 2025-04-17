'use client'

import { useMemo } from 'react'

import { BookOpenIcon, ClockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { capitalize } from '@repo/utils'

import { ModuleStatus, type Module } from '@/api/modules'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { DashboardIcon } from '@/components/ui/icons'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { dynamicRoute, Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'
import { type Localized } from '@/services/i18n'

export const ModuleCard = ({ module }: { module: Localized<Module> }) => {
  const t = useTranslations()

  const modulePath = useMemo(
    () =>
      dynamicRoute(Route.Module, {
        slug: module.skill.slug,
      }),
    [module.skill.slug],
  )

  const difficulty = useMemo(() => {
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

  const duration = useMemo(() => {
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

  const progressColor = useMemo(() => (module.status === ModuleStatus.Completed ? 'success' : 'default'), [module.status])

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
            <h3 className="text-lg font-semibold">
              {module.title} {module.status === ModuleStatus.Completed && <span className="ml-0.5 text-success">{'✔︎'}</span>}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="text-xs font-normal" color="muted" variant="outline">
              <BookOpenIcon className="h-3 w-3" />
              {module.steps_count}{' '}
              {t('Common.lessons', {
                count: module.steps_count,
              })}
            </Badge>
            {difficulty && (
              <Badge className="text-xs font-normal" color="muted" variant="outline">
                <DashboardIcon className="h-3 w-3 fill-muted-foreground" />
                {difficulty}
              </Badge>
            )}
            {duration && (
              <Badge className="flex items-center text-xs font-normal" color="muted" variant="outline">
                <ClockIcon className="h-3 w-3" />
                {duration}
              </Badge>
            )}
          </div>
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
        </CardContent>
      </div>
      <CardFooter className="mt-4 flex-col gap-4">
        {module.status !== ModuleStatus.NotStarted && (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center">
                {module.completed_steps_count}
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
          <Button className="w-full dark:hover:bg-background/50" variant="outline">
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
