'use client'

import { useMemo } from 'react'

import { CalendarIcon, ClockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { titleize } from '@repo/utils'

import { type LocalizedModule } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { useLocale } from '@/hooks/use-locale'
import { route, Route } from '@/lib/navigation'
import { Asset } from '@/lib/storage'

interface ModuleCardProps {
  module: LocalizedModule
}

export const ModuleCard = ({ module }: ModuleCardProps) => {
  const [locale] = useLocale()
  const t = useTranslations()

  const moduleUrl = useMemo(() => route(Route.Modules, module.skill.slug), [module.skill.slug])

  const moduleDate = useMemo(() => {
    const date = new Date(module.updated_at)
    const now = new Date()
    const diff = Math.abs(now.getTime() - date.getTime())
    const diffInDays = Math.floor(diff / (1000 * 3600 * 24))
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (diffInYears > 0) return t('Common.updatedYearsAgo', { count: diffInYears })
    if (diffInMonths > 0) return t('Common.updatedMonthsAgo', { count: diffInMonths })
    if (diffInDays > 1) return t('Common.updatedDaysAgo', { count: diffInDays })
    if (diffInDays === 1) return t('Common.updatedYesterday')
    return t('Common.updatedToday')
  }, [module.updated_at, t])

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

  return (
    <Card className="flex h-full flex-col justify-between overflow-hidden pt-0">
      <div>
        <div className="relative h-48 w-full">
          <Link href={moduleUrl} title={t('Modules.startModule')}>
            <Image alt={module.title} className="object-cover" fill src={module.image_url || Asset.Placeholder} />
          </Link>
        </div>
        <CardHeader className="pt-6 pb-4">
          <Link href={moduleUrl}>
            <h3 className="text-lg font-semibold">{module.title}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="text-xs" color="primary">
              {module.skill.icon_url && (
                <Image
                  alt={module.skill.slug}
                  className="mr-1 h-3 w-3 rounded-full"
                  height={16}
                  src={module.skill.icon_url}
                  width={16}
                />
              )}
              {module.skill.name[locale]}
            </Badge>
            {module.skill.subskills.slice(0, 3).map(subskill => (
              <Badge className="flex items-center text-[10px]" color="secondary.accent" key={subskill.id}>
                {titleize(subskill.name[locale])}
              </Badge>
            ))}
          </div>
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
            {module.created_at && (
              <Badge className="flex items-center text-xs" color="muted" variant="outline">
                <CalendarIcon className="mr-1 h-3 w-3" />
                {moduleDate}
              </Badge>
            )}
          </div>
          {/* <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            {module.status === 'not-started' ? <PlayIcon className="mr-1 h-4 w-4" /> : <ClockIcon className="mr-1 h-4 w-4" />}
            {module.completedLessons}
            {' / '}
            {module.totalLessons} {'lessons'}
          </span>
          <span>
            {module.progress}
            {'% complete'}
          </span>
        </div>
        <Progress className="h-2" value={module.progress} /> */}
        </CardContent>
      </div>
      <CardFooter>
        <Link className="w-full" href={moduleUrl}>
          <Button className="w-full" variant="outline">
            {t('Modules.startModule')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
