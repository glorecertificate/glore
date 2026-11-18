export const SettingsSection = ({
  children,
  description,
  title,
}: React.PropsWithChildren<{ description: string; title: string }>) => (
  <section className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_2fr] md:gap-8">
    <div>
      <h3 className="type-heading text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>
    </div>
    <div className="flex min-w-0 flex-col gap-4">{children}</div>
  </section>
)
