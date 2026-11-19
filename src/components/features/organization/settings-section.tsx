export const SettingsSection = ({
  children,
  description,
  id,
  title,
}: React.PropsWithChildren<{ description: string; id?: string; title: string }>) => (
  <section className="@container/section scroll-mt-4" id={id}>
    <div className="grid gap-4 @3xl/section:grid-cols-[minmax(220px,1fr)_2fr] @3xl/section:gap-8">
      <div>
        <h3 className="type-heading text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      <div className="@container/fields flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  </section>
)
