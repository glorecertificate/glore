import { type VariantProps } from 'class-variance-authority'

import { chipVariants } from '@/components/features/about/info-tone'
import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
