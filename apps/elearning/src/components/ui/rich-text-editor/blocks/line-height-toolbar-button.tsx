'use client'

import { useState } from 'react'

import { LineHeightPlugin } from '@platejs/basic-styles/react'
import { DropdownMenuItemIndicator, type DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import { CheckIcon, WrapText } from 'lucide-react'
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToolbarButton } from '@rte/blocks/toolbar'

export const LineHeightToolbarButton = (props: DropdownMenuProps) => {
  const editor = useEditorRef()
  const injectedProps = editor.getInjectProps(LineHeightPlugin)
  const values = (injectedProps.validNodeValues ?? []) as string[]
  const defaultValue = injectedProps.defaultNodeValue as string | undefined

  const selectionValue = useSelectionFragmentProp({
    defaultValue,
    getProp: node => node.lineHeight,
  })

  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open} tooltip="Line height">
          <WrapText />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-0">
        <DropdownMenuRadioGroup
          onValueChange={newValue => {
            editor.getTransforms(LineHeightPlugin).lineHeight.setNodes(Number(newValue))
            editor.tf.focus()
          }}
          value={selectionValue}
        >
          {values.map(value => (
            <DropdownMenuRadioItem className="min-w-[180px] pl-2 *:first:[span]:hidden" key={value} value={value}>
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {value}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
