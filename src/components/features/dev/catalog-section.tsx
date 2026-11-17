export const CatalogSection = ({ children, id, name }: { children: React.ReactNode; id: string; name: string }) => (
  <section aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-3" id={id}>
    <h2 className="type-heading text-foreground" id={`${id}-title`}>
      {name}
    </h2>
    <div className="flex flex-col divide-y rounded-lg border bg-card">{children}</div>
  </section>
)
