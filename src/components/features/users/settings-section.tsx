'use client'

import { memo } from 'react'

export const SettingsSection = memo(
  ({
    children,
    description,
    title,
  }: React.ComponentProps<'div'> & {
    description: string
  }) => (
    <section className="grid gap-6 md:grid-cols-[minmax(200px,1fr)_2fr]">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
)
