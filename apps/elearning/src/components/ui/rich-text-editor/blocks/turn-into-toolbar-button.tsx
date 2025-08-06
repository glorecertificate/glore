'use client'

import { useMemo, useState } from 'react'

import { DropdownMenuItemIndicator, type DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import {
  CheckIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react'
import { KEYS, type TElement } from 'platejs'
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton, ToolbarMenuGroup } from '#rte/blocks/toolbar'
import { getBlockType, setBlockType } from '#rte/utils'

export const TurnIntoToolbarButton = (props: DropdownMenuProps) => {
  const editor = useEditorRef()
  const t = useTranslations('Editor')

  const [open, setOpen] = useState(false)

  const turnIntoItems = useMemo(
    () => [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph'],
        label: t('blocks.paragraph'),
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1'],
        label: t('blocks.heading1'),
        value: 'h1',
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2'],
        label: t('blocks.heading2'),
        value: 'h2',
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3'],
        label: t('blocks.heading3'),
        value: 'h3',
      },
      {
        icon: <Heading4Icon />,
        keywords: ['subtitle', 'h4'],
        label: t('blocks.heading4'),
        value: 'h4',
      },
      {
        icon: <Heading5Icon />,
        keywords: ['subtitle', 'h5'],
        label: t('blocks.heading5'),
        value: 'h5',
      },
      {
        icon: <Heading6Icon />,
        keywords: ['subtitle', 'h6'],
        label: t('blocks.heading6'),
        value: 'h6',
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-'],
        label: t('blocks.bulletList'),
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        keywords: ['ordered', 'ol', '1'],
        label: t('blocks.numberedList'),
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
        keywords: ['checklist', 'task', 'checkbox', '[]'],
        label: t('blocks.todoList'),
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable'],
        label: t('blocks.toggle'),
        value: KEYS.toggle,
      },
      {
        icon: <FileCodeIcon />,
        keywords: ['```'],
        label: t('blocks.codeBlock'),
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
        keywords: ['citation', 'blockquote', '>'],
        label: t('blocks.quote'),
        value: KEYS.blockquote,
      },
      {
        icon: <Columns3Icon />,
        label: t('blocks.threeColumns'),
        value: 'action_three_columns',
      },
    ],
    [t],
  )

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: node => getBlockType(node as TElement),
  })

  const selectedItem = useMemo(
    () => turnIntoItems.find(item => item.value === (value ?? KEYS.p)) ?? turnIntoItems[0],
    [turnIntoItems, value],
  )

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton className="min-w-[125px] pr-2 pl-3 font-normal" isDropdown pressed={open}>
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={e => {
          e.preventDefault()
          editor.tf.focus()
        }}
      >
        <ToolbarMenuGroup
          label={t('actions.turnInto')}
          onValueChange={type => {
            setBlockType(editor, type)
          }}
          value={value}
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              className="min-w-[180px] cursor-pointer pl-2 *:first:[span]:hidden"
              key={itemValue}
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
