'use client'

import { useState } from 'react'

import type { Alignment } from '@platejs/basic-styles'
import { TextAlignPlugin } from '@platejs/basic-styles/react'
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-react'
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { ToolbarButton } from '#rte/blocks/toolbar'

const items = [
  {
    icon: AlignLeftIcon,
    value: 'left',
  },
  {
    icon: AlignCenterIcon,
    value: 'center',
  },
  {
    icon: AlignRightIcon,
    value: 'right',
  },
  {
    icon: AlignJustifyIcon,
    value: 'justify',
  },
]

export const AlignToolbarButton = (props: DropdownMenuProps) => {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin)
  const value = useSelectionFragmentProp({
    defaultValue: 'left',
    getProp: node => node.align,
  })
  const t = useTranslations('Editor.actions')

  const [open, setOpen] = useState(false)
  const IconValue = items.find(item => item.value === value)?.icon ?? AlignLeftIcon

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open} tooltip={t('align')}>
          <IconValue />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-0">
        <DropdownMenuRadioGroup
          onValueChange={value => {
            tf.textAlign.setNodes(value as Alignment)
            editor.tf.focus()
          }}
          value={value}
        >
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              className={cn(
                'cursor-pointer pl-2 data-[state=checked]:bg-accent *:first:[span]:hidden',
                value === itemValue && 'pointer-events-none bg-accent',
              )}
              key={itemValue}
              value={itemValue}
            >
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
