'use client'

import { cn } from '@/lib/utils'

export const SettingsSection = ({
  children,
  className,
  description,
  title,
  ...props
}: Omit<React.ComponentProps<'section'>, 'title'> & {
  description?: React.ReactNode
  title: React.ReactNode
}) => (
  <section className={cn('flex flex-col gap-4', className)} {...props}>
    <div className="min-w-0">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>}
    </div>
    <div className="@container/fields min-w-0 space-y-4">{children}</div>
  </section>
)
