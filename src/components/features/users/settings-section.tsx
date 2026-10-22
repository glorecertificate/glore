'use client'

export const SettingsSection = ({
  children,
  description,
  title,
}: React.ComponentProps<'div'> & {
  description: string
}) => (
  <section className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)]">
    <div className="min-w-0 md:pt-0.5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-balance text-muted-foreground">{description}</p>
    </div>
    <div className="min-w-0 space-y-4">{children}</div>
  </section>
)
