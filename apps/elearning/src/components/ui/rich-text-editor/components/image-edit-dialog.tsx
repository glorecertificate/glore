import { useState } from 'react'

import { ImageIcon } from '@radix-ui/react-icons'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ImageEditBlock } from '@/components/ui/rich-text-editor/components/image-edit-block'
import { ToolbarButton } from '@/components/ui/rich-text-editor/components/toolbar-button'
import type { toggleVariants } from '@/components/ui/toggle'

export interface ImageEditDialogProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

export const ImageEditDialog = ({ editor, size, variant }: ImageEditDialogProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <ToolbarButton
          aria-label="Image"
          isActive={editor.isActive('image')}
          size={size}
          tooltip="Image"
          variant={variant}
        >
          <ImageIcon className="size-5" />
        </ToolbarButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{'Select image'}</DialogTitle>
          <DialogDescription className="sr-only">{'Upload an image from your computer'}</DialogDescription>
        </DialogHeader>
        <ImageEditBlock close={() => setOpen(false)} editor={editor} />
      </DialogContent>
    </Dialog>
  )
}
