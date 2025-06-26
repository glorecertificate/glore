import { useCallback, useState } from 'react'

import { Link2Icon } from '@radix-ui/react-icons'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LinkEditBlock } from '@/components/ui/rich-text-editor/components/link-edit-block'
import { ToolbarButton } from '@/components/ui/rich-text-editor/components/toolbar-button'
import type { toggleVariants } from '@/components/ui/toggle'

export interface LinkEditPopoverProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

export const LinkEditPopover = ({ editor, size, variant }: LinkEditPopoverProps) => {
  const [open, setOpen] = useState(false)

  const { from, to } = editor.state.selection
  const text = editor.state.doc.textBetween(from, to, ' ')

  const onSetLink = useCallback(
    (url: string, text?: string, openInNewTab?: boolean) => {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .insertContent({
          type: 'text',
          text: text || url,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
                target: openInNewTab ? '_blank' : '',
              },
            },
          ],
        })
        .setLink({ href: url })
        .run()

      editor.commands.enter()
    },
    [editor],
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <ToolbarButton
          aria-label="Insert link"
          disabled={editor.isActive('codeBlock')}
          isActive={editor.isActive('link')}
          size={size}
          tooltip="Link"
          variant={variant}
        >
          <Link2Icon className="size-5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-full min-w-80" side="bottom">
        <LinkEditBlock defaultText={text} onSave={onSetLink} />
      </PopoverContent>
    </Popover>
  )
}
