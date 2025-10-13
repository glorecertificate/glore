'use client'

import { useMemo } from 'react'

import { AIChatPlugin } from '@platejs/ai/react'
import {
  CalendarIcon,
  ChevronRightIcon,
  Code2Icon,
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SparklesIcon,
  SquareIcon,
  TableIcon,
  TableOfContentsIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS, type TComboboxInputElement } from 'platejs'
import { type PlateEditor, PlateElement, type PlateElementProps } from 'platejs/react'

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@/components/blocks/rich-text-editor/ui/inline-combobox'
import { insertBlock, insertInlineElement } from '@/components/blocks/rich-text-editor/utils'

interface Group {
  group: string
  items: {
    icon: React.ReactNode
    value: string
    onSelect: (editor: PlateEditor, value: string) => void
    className?: string
    focusEditor?: boolean
    keywords?: string[]
    label?: string
  }[]
}

export const SlashInputElement = (props: PlateElementProps<TComboboxInputElement>) => {
  const { editor, element } = props
  const t = useTranslations('Editor.blocks')

  const groups = useMemo<Group[]>(
    () => [
      {
        group: t('ai'),
        items: [
          {
            focusEditor: false,
            icon: <SparklesIcon />,
            value: 'AI',
            onSelect: editor => {
              editor.getApi(AIChatPlugin).aiChat.show()
            },
          },
        ],
      },
      {
        group: t('basicBlocks'),
        items: [
          {
            icon: <PilcrowIcon />,
            keywords: ['paragraph'],
            label: t('paragraph'),
            value: KEYS.p,
          },
          {
            icon: <Heading1Icon />,
            keywords: ['title', 'h1'],
            label: t('heading1'),
            value: KEYS.h1,
          },
          {
            icon: <Heading2Icon />,
            keywords: ['subtitle', 'h2'],
            label: t('heading2'),
            value: KEYS.h2,
          },
          {
            icon: <Heading3Icon />,
            keywords: ['subtitle', 'h3'],
            label: t('heading3'),
            value: KEYS.h3,
          },
          {
            icon: <ListIcon />,
            keywords: ['unordered', 'ul', '-'],
            label: t('bulletList'),
            value: KEYS.ul,
          },
          {
            icon: <ListOrderedIcon />,
            keywords: ['ordered', 'ol', '1'],
            label: t('orderedList'),
            value: KEYS.ol,
          },
          {
            icon: <SquareIcon />,
            keywords: ['checklist', 'task', 'checkbox', '[]'],
            label: t('todoList'),
            value: KEYS.listTodo,
          },
          {
            icon: <ChevronRightIcon />,
            keywords: ['collapsible', 'expandable'],
            label: t('toggle'),
            value: KEYS.toggle,
          },
          {
            icon: <Code2Icon />,
            keywords: ['```'],
            label: t('codeBlock'),
            value: KEYS.codeBlock,
          },
          {
            icon: <TableIcon />,
            label: t('table'),
            value: KEYS.table,
          },
          {
            icon: <QuoteIcon />,
            keywords: ['citation', 'blockquote', 'quote', '>'],
            label: t('blockquote'),
            value: KEYS.blockquote,
          },
          {
            description: 'Insert a highlighted block.',
            icon: <LightbulbIcon />,
            keywords: ['note'],
            label: t('callout'),
            value: KEYS.callout,
          },
        ].map(item => ({
          ...item,
          onSelect: (editor, value) => {
            insertBlock(editor, value)
          },
        })),
      },
      {
        group: t('advancedBlocks'),
        items: [
          {
            icon: <TableOfContentsIcon />,
            keywords: ['toc'],
            label: t('tableOfContents'),
            value: KEYS.toc,
            onSelect: (editor, value) => {
              insertBlock(editor, value)
            },
          },
          {
            icon: <Columns3Icon />,
            label: t('threeColumns'),
            value: 'action_three_columns',
            onSelect: (editor, value) => {
              insertBlock(editor, value)
            },
          },
          {
            focusEditor: true,
            icon: <CalendarIcon />,
            keywords: ['time'],
            label: t('date'),
            value: KEYS.date,
            onSelect: (editor, value) => {
              insertInlineElement(editor, value)
            },
          },
        ],
      },
    ],
    [t]
  )

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>{'No results'}</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(({ focusEditor, icon, keywords, label, onSelect, value }) => (
                <InlineComboboxItem
                  focusEditor={focusEditor}
                  group={group}
                  key={value}
                  keywords={keywords}
                  label={label}
                  onClick={() => onSelect(editor, value)}
                  value={value}
                >
                  <div className="mr-2 text-muted-foreground">{icon}</div>
                  {label ?? value}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  )
}
