import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type EarnedSkill } from '@/actions/dashboard/core'
import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const Seal = ({ icon }: { icon: string | null | false }) => (
  <span
    aria-hidden
    className={cn(
      'flex size-14 shrink-0 items-center justify-center rounded-full border p-1',
      icon === false ? 'border-dashed border-border-strong' : 'border-earned-border'
    )}
  >
    <span
      className={cn(
        'flex size-full items-center justify-center rounded-full',
        icon === false ? 'bg-surface-muted' : 'border border-earned-border bg-earned-subtle text-earned-text'
      )}
    >
      {icon !== false && <LucideIcon className="size-5" name={(icon ?? 'award') as IconName} />}
    </span>
  </span>
)

export const SkillSeals = ({ className, min, skills }: { className?: string; min: number; skills: EarnedSkill[] }) => {
  const t = useTranslations('Dashboard.journey')
  const slots = Array.from({ length: Math.max(0, min - skills.length) }, (_, index) => `slot-${index}`)

  return (
    <ul
      aria-label={t('seals.label')}
      className={cn('flex flex-wrap gap-x-3 gap-y-4', className)}
      data-slot="skill-seals"
    >
      {skills.map(skill => (
        <li key={skill.id}>
          <Link
            className="group flex w-22 flex-col items-center gap-2 rounded-md text-center focus-visible:focus-ring"
            href={`/courses/${skill.slug}` as Route}
          >
            <Seal icon={skill.icon} />
            <span className="line-clamp-2 type-caption text-fg-1 group-hover:text-fg-title">{skill.title}</span>
          </Link>
        </li>
      ))}
      {slots.map(slot => (
        <li className="flex w-22 flex-col items-center gap-2 text-center" key={slot}>
          <Seal icon={false} />
          <span className="type-caption text-fg-2">{t('seals.missing')}</span>
        </li>
      ))}
    </ul>
  )
}
