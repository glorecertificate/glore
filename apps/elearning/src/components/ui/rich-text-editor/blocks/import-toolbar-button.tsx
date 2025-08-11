'use client'

import { useState } from 'react'

import { MarkdownPlugin } from '@platejs/markdown'
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import { ArrowUpToLineIcon } from 'lucide-react'
import { getEditorDOMFromHtmlString, type Descendant } from 'platejs'
import { useEditorRef } from 'platejs/react'
import { useFilePicker } from 'use-file-picker'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton } from '@rte/blocks/toolbar'

type ImportType = 'html' | 'markdown'

export const ImportToolbarButton = (props: DropdownMenuProps) => {
  const t = useTranslations('Editor')
  const editor = useEditorRef()
  const [open, setOpen] = useState(false)

  const getFileNodes = (text: string, type: ImportType) => {
    if (type === 'html') {
      const editorNode = getEditorDOMFromHtmlString(text)
      const nodes = editor.api.html.deserialize({
        element: editorNode,
      })

      return nodes
    }

    if (type === 'markdown') {
      return editor.getApi(MarkdownPlugin).markdown.deserialize(text) as Descendant[]
    }

    return []
  }

  const { openFilePicker: openMdFilePicker } = useFilePicker({
    accept: ['.md', '.mdx'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const files = (await plainFiles) as File[]
      if (files.length === 0) return

      const text = await files[0].text()
      const nodes = getFileNodes(text, 'markdown')

      editor.tf.insertNodes(nodes)
    },
  })

  const { openFilePicker: openHtmlFilePicker } = useFilePicker({
    accept: ['text/html'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const files = (await plainFiles) as File[]
      if (files.length === 0) return

      const text = await files[0].text()
      const nodes = getFileNodes(text, 'html')

      editor.tf.insertNodes(nodes)
    },
  })

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton isDropdown pressed={open} tooltip={t('actions.import')}>
          <ArrowUpToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              openHtmlFilePicker()
            }}
          >
            {t('actions.importFromHtml')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              openMdFilePicker()
            }}
          >
            {t('actions.importFromMarkdown')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
