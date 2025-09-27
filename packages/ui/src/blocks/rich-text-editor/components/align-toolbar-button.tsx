'use client'

import type { Alignment } from '@platejs/basic-styles'
import { TextAlignPlugin } from '@platejs/basic-styles/react'
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from 'lucide-react'
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from '@repo/ui/components/dropdown-menu'
import { ToolbarButton } from '@repo/ui/components/toolbar'
import { cn } from '@repo/ui/utils'

import { useI18n } from '../hooks/use-i18n'

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
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const IconValue = items.find(item => item.value === value)?.icon ?? AlignLeftIcon

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open} tooltip={t.actions.align}>
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
