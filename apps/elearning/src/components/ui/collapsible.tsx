'use client'

import { Content, Root, Trigger } from '@radix-ui/react-collapsible'

export const Collapsible = ({ ...props }: React.ComponentProps<typeof Root>) => (
  <Root data-slot="collapsible" {...props} />
)

export const CollapsibleTrigger = ({ ...props }: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="collapsible-trigger" {...props} />
)

export const CollapsibleContent = ({ ...props }: React.ComponentProps<typeof Content>) => (
  <Content data-slot="collapsible-content" {...props} />
)
