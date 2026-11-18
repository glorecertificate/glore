export const CatalogRow = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="grid gap-3 p-4 sm:grid-cols-4 sm:items-center">
    <code className="font-mono text-xs text-muted-foreground">{label}</code>
    <div className="flex min-w-0 flex-wrap items-center gap-3 sm:col-span-3">{children}</div>
  </div>
)
