'use client'

import { useTranslations } from 'next-intl'

import { SkillCompassDialog } from '@/components/features/courses/skill-compass/dialog'
import { LucideIcon } from '@/components/icons/lucide'
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
    <section
      aria-labelledby="skill-compass-title"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-border-subtle bg-card px-4 py-3 text-card-foreground shadow-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <LucideIcon aria-hidden className="size-5 shrink-0 text-brand-text" name="compass" />
          <p className="min-w-0 text-sm text-muted-foreground">
            <span className="font-medium text-foreground" id="skill-compass-title">
              {t('title')}
            </span>
            {' · '}
            {hasCompass ? t('summary', { goals: goals.length, strengths: strengths.length }) : t('setupHint')}
          </p>
        </div>
        <SkillCompassDialog goals={goals} options={options} strengths={strengths}>
          <Button size="sm" variant="outline">
            {hasCompass ? t('edit') : t('setup')}
          </Button>
        </SkillCompassDialog>
      </header>
      {recommendations.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2">
          <li className="type-label text-muted-foreground">{t('recommendedTitle')}</li>
          {recommendations.map(({ icon, id, slug, title }) => (
            <li key={id}>
              <Link
                className="flex min-h-8 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-surface-hover"
                href={`/courses/${slug}`}
              >
                <LucideIcon className="size-4 shrink-0 text-brand-text" name={(icon ?? 'book-open') as IconName} />
                <span className="truncate">{title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
