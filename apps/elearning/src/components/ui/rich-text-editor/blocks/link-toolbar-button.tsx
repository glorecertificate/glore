'use client'

import { useLinkToolbarButton, useLinkToolbarButtonState } from '@platejs/link/react'
import { Link } from 'lucide-react'

import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton } from '#rte/blocks/toolbar'

export const LinkToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const state = useLinkToolbarButtonState()
  const { props: buttonProps } = useLinkToolbarButton(state)
  const t = useTranslations('Editor.blocks')

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip={t('link')}>
      <Link />
    </ToolbarButton>
  )
}
