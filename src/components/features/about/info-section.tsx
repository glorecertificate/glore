import { cn } from '@/lib/utils'

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
