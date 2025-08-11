'use client'

import { useCallback, useMemo, useState } from 'react'

import { SuggestionPlugin } from '@platejs/suggestion/react'
import { DropdownMenuItemIndicator, type DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import { CheckIcon, EyeIcon, PenIcon } from 'lucide-react'
import { useEditorRef, usePlateState } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton } from '@rte/blocks/toolbar'

export const ModeToolbarButton = (props: DropdownMenuProps) => {
  const editor = useEditorRef()
  const [readOnly, setReadOnly] = usePlateState('readOnly')
  const t = useTranslations('Editor.mode')

  const [open, setOpen] = useState(false)

  const value = useMemo(() => (readOnly ? 'viewing' : 'editing'), [readOnly])

  const item = useMemo(
    () => ({
      editing: {
        icon: <PenIcon />,
        label: t('editing'),
      },
      viewing: {
        icon: <EyeIcon />,
        label: t('viewing'),
      },
    }),
    [t],
  )

  const onValueChange = useCallback(
    (newValue: string) => {
      if (newValue === 'viewing') return setReadOnly(true)
      setReadOnly(false)
      if (newValue === 'suggestion') return editor.setOption(SuggestionPlugin, 'isSuggesting', true)
      editor.setOption(SuggestionPlugin, 'isSuggesting', false)
      if (newValue === 'editing') editor.tf.focus()
    },
    [editor, setReadOnly],
  )

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open}>
          {item[value].icon}
          <span className="hidden lg:inline">{item[value].label}</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuRadioGroup onValueChange={onValueChange} value={value}>
          <DropdownMenuRadioItem className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground" value="editing">
            <Indicator />
            {item.editing.icon}
            {item.editing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground" value="viewing">
            <Indicator />
            {item.viewing.icon}
            {item.viewing.label}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const Indicator = () => (
  <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
    <DropdownMenuItemIndicator>
      <CheckIcon />
    </DropdownMenuItemIndicator>
  </span>
)
