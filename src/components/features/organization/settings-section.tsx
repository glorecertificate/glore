export const SettingsSection = ({
  children,
  description,
  title,
}: React.PropsWithChildren<{ description: string; title: string }>) => (
  <section className="grid gap-6 md:grid-cols-[minmax(220px,1fr)_2fr]">
    <div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
)
