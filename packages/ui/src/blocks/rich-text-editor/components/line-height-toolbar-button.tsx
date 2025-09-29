'use client'

import { LineHeightPlugin } from '@platejs/basic-styles/react'
import { CheckIcon, WrapText } from 'lucide-react'
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react'
import { useState } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from '@repo/ui/components/dropdown-menu'
import { ToolbarButton } from '@repo/ui/components/toolbar'

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
