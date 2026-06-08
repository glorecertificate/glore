'use client'

export const SettingsSection = ({
  children,
  description,
  title,
}: React.ComponentProps<'div'> & {
  description: string
}) => (
  <section className="grid gap-x-10 gap-y-4 md:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)]">
    <div className="md:pt-0.5">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-balance text-muted-foreground">{description}</p>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
)
