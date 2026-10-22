'use client'

import { useTranslations } from 'next-intl'

import { SkillCompassDialog } from '@/components/features/courses/skill-compass/dialog'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { type IconName } from '@/lib/types'

export interface CompassOption {
  completed: boolean
  icon: string | null
  id: number
  slug: string
  title: string
}

interface CompassRecommendation {
  icon: string | null
  id: number
  slug: string
  title: string
}

const SkillChips = ({ ids, options }: { ids: number[]; options: CompassOption[] }) => {
  const byId = new Map(options.map(option => [option.id, option]))
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ids.map(id => (
        <li key={id}>
          <Badge variant="outline">{byId.get(id)?.title}</Badge>
        </li>
      ))}
    </ul>
  )
}

export const SkillCompassCard = ({
  goals,
  options,
  recommendations,
  strengths,
}: {
  goals: number[]
  options: CompassOption[]
  recommendations: CompassRecommendation[]
  strengths: number[]
}) => {
  const t = useTranslations('Learning.catalog.compass')
  const hasCompass = goals.length + strengths.length > 0

  return (
    <section aria-labelledby="skill-compass-title" className="mb-6 flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand/15 text-brand-text">
            <LucideIcon className="size-5" name="compass" />
          </span>
          <div className="flex flex-col">
            <h2 className="font-semibold" id="skill-compass-title">
              {t('title')}
            </h2>
            <p className="text-sm text-muted-foreground">{hasCompass ? t('hint') : t('setupHint')}</p>
          </div>
        </div>
        <SkillCompassDialog goals={goals} options={options} strengths={strengths}>
          <Button size="sm" variant={hasCompass ? 'outline' : 'brand'}>
            {hasCompass ? t('edit') : t('setup')}
          </Button>
        </SkillCompassDialog>
      </header>
      {hasCompass && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t('strengthsTitle')}</h3>
            <SkillChips ids={strengths} options={options} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t('goalsTitle')}</h3>
            <SkillChips ids={goals} options={options} />
          </div>
        </div>
      )}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t('recommendedTitle')}</h3>
          <ul className="grid gap-2 sm:grid-cols-3">
            {recommendations.map(({ icon, id, slug, title }) => (
              <li key={id}>
                <Link
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                  href={`/courses/${slug}`}
                >
                  <LucideIcon className="size-4 shrink-0 text-brand-text" name={(icon ?? 'book-open') as IconName} />
                  <span className="truncate">{title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
