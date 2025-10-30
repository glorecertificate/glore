'use client'

import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { LinkIcon } from 'lucide-react'

import { ToolbarButton } from '@/components/ui/toolbar'

export const LinkToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useLinkToolbarButtonState()
  const { props: buttonProps } = useLinkToolbarButton(state)

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus>
      <LinkIcon />
    </ToolbarButton>
  )
}
