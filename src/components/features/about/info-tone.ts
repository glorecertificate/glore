import { type VariantProps, cva } from 'class-variance-authority'

export const chipVariants = cva('flex size-9 shrink-0 items-center justify-center rounded-lg', {
  defaultVariants: { tone: 'action' },
  variants: {
    tone: {
      action: 'bg-action-subtle text-action-text',
      earned: 'bg-earned-subtle text-earned-text',
      info: 'bg-info-subtle text-info-text',
      navy: 'bg-surface-muted text-fg-title',
    },
  },
})

export type InfoTone = NonNullable<VariantProps<typeof chipVariants>['tone']>
