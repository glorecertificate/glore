'use client'

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react'
import { ListCollapseIcon } from 'lucide-react'

import { ToolbarButton } from '@repo/ui/components/toolbar'

import { useI18n } from '../hooks/use-i18n'

export const ToggleToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useToggleToolbarButtonState()
  const { props: buttonProps } = useToggleToolbarButton(state)
  const { t } = useI18n('blocks')

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t.toggle}>
      <ListCollapseIcon />
    </ToolbarButton>
  )
}
