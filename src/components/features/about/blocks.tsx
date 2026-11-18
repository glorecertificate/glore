import { type VariantProps, cva } from 'class-variance-authority'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const chipVariants = cva('flex size-9 shrink-0 items-center justify-center rounded-lg', {
  defaultVariants: { tone: 'action' },
  variants: {
    tone: {
      action: 'bg-action-subtle text-action-text',
      earned: 'bg-earned-subtle text-earned-text',
      info: 'bg-info-subtle text-info-text',
      navy: 'bg-surface-muted text-fg-title',
    },
  },
})

export type InfoTone = NonNullable<VariantProps<typeof chipVariants>['tone']>

export const InfoSection = ({
  children,
  className,
  description,
  title,
}: React.ComponentProps<'section'> & { description?: string; title: string }) => (
  <section className={cn('flex flex-col gap-5', className)}>
    <header className="flex flex-col gap-1">
      <h2 className="font-display text-xl font-semibold tracking-tight text-balance text-fg-title">{title}</h2>
      {description && <p className="max-w-prose text-sm text-pretty text-fg-2">{description}</p>}
    </header>
    {children}
  </section>
)

export const InfoCard = ({
  children,
  className,
  description,
  icon,
  title,
  tone,
}: Omit<React.ComponentProps<'div'>, 'title'> &
  VariantProps<typeof chipVariants> & { description: string; icon?: IconName; title: string }) => (
  <Card className={cn('h-full gap-4', className)}>
    {icon && (
      <div aria-hidden className={chipVariants({ tone })}>
        <LucideIcon name={icon} className="size-4.5" />
      </div>
    )}
    <div className="flex flex-col gap-1.5">
      <h3 className="type-heading text-fg-1">{title}</h3>
      <p className="text-sm/relaxed text-pretty text-fg-2">{description}</p>
    </div>
    {children}
  </Card>
)
