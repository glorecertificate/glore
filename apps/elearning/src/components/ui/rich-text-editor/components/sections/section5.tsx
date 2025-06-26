import { CaretDownIcon, CodeIcon, DividerHorizontalIcon, PlusIcon, QuoteIcon } from '@radix-ui/react-icons'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'

import { ImageEditDialog } from '@/components/ui/rich-text-editor/components/image-edit-dialog'
import { LinkEditPopover } from '@/components/ui/rich-text-editor/components/link-edit-popover'
import { ToolbarSection } from '@/components/ui/rich-text-editor/components/toolbar-section'
import type { FormatAction } from '@/components/ui/rich-text-editor/types'
import type { toggleVariants } from '@/components/ui/toggle'

type InsertElementAction = 'codeBlock' | 'blockquote' | 'horizontalRule'

interface InsertElement extends FormatAction {
  value: InsertElementAction
}

const formatActions: InsertElement[] = [
  {
    value: 'codeBlock',
    label: 'Code block',
    icon: <CodeIcon className="size-5" />,
    action: editor => editor.chain().focus().toggleCodeBlock().run(),
    isActive: editor => editor.isActive('codeBlock'),
    canExecute: editor => editor.can().chain().focus().toggleCodeBlock().run(),
    shortcuts: ['mod', 'alt', 'C'],
  },
  {
    value: 'blockquote',
    label: 'Blockquote',
    icon: <QuoteIcon className="size-5" />,
    action: editor => editor.chain().focus().toggleBlockquote().run(),
    isActive: editor => editor.isActive('blockquote'),
    canExecute: editor => editor.can().chain().focus().toggleBlockquote().run(),
    shortcuts: ['mod', 'shift', 'B'],
  },
  {
    value: 'horizontalRule',
    label: 'Divider',
    icon: <DividerHorizontalIcon className="size-5" />,
    action: editor => editor.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
    canExecute: editor => editor.can().chain().focus().setHorizontalRule().run(),
    shortcuts: ['mod', 'alt', '-'],
  },
]

export interface SectionFiveProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  activeActions?: InsertElementAction[]
  mainActionCount?: number
}

export const SectionFive: React.FC<SectionFiveProps> = ({
  activeActions = formatActions.map(action => action.value),
  editor,
  mainActionCount = 0,
  size,
  variant,
}) => (
  <>
    <LinkEditPopover editor={editor} size={size} variant={variant} />
    <ImageEditDialog editor={editor} size={size} variant={variant} />
    <ToolbarSection
      actions={formatActions}
      activeActions={activeActions}
      dropdownIcon={
        <>
          <PlusIcon className="size-5" />
          <CaretDownIcon className="size-5" />
        </>
      }
      dropdownTooltip="Insert elements"
      editor={editor}
      mainActionCount={mainActionCount}
      size={size}
      variant={variant}
    />
  </>
)
