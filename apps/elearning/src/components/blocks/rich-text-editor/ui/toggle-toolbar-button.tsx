'use client'

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react'
import { ListCollapseIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ToolbarButton } from '@/components/ui/toolbar'

export const ToggleToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useToggleToolbarButtonState()
  const { props: buttonProps } = useToggleToolbarButton(state)
  const t = useTranslations('Components.RichTextEditor.blocks')

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('toggle')}>
      <ListCollapseIcon />
    </ToolbarButton>
  )
}
