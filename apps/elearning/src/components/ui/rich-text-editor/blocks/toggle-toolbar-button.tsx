'use client'

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react'
import { ListCollapseIcon } from 'lucide-react'

import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton } from '#rte/blocks/toolbar'

export const ToggleToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useToggleToolbarButtonState()
  const { props: buttonProps } = useToggleToolbarButton(state)
  const t = useTranslations('Editor.blocks')

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('toggle')}>
      <ListCollapseIcon />
    </ToolbarButton>
  )
}
