'use client'

import { useIndentButton, useOutdentButton } from '@platejs/indent/react'
import { IndentIcon, OutdentIcon } from 'lucide-react'

import { ToolbarButton } from '#rte/blocks/toolbar'

export const IndentToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const { props: buttonProps } = useIndentButton()

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Indent">
      <IndentIcon />
    </ToolbarButton>
  )
}

export const OutdentToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const { props: buttonProps } = useOutdentButton()

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Outdent">
      <OutdentIcon />
    </ToolbarButton>
  )
}
