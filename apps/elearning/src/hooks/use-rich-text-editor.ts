import { useCallback } from 'react'

import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Typography } from '@tiptap/extension-typography'
import { Underline } from '@tiptap/extension-underline'
import { useEditor, type Content, type Editor, type UseEditorOptions } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { toast } from 'sonner'

import { isServer, noop } from '@repo/utils'

import {
  CodeBlockLowlight,
  Color,
  FileHandler,
  HorizontalRule,
  Image,
  Link,
  ResetMarksOnEnter,
  Selection,
  UnsetAllMarks,
} from '@/components/ui/rich-text-editor/extensions'
import { fileToBase64, getOutput, randomId } from '@/components/ui/rich-text-editor/utils'
import { useThrottle } from '@/hooks/use-throttle'
import { cn } from '@/lib/utils'

export interface UseRichTextEditorProps extends UseEditorOptions {
  value?: Content
  output?: 'html' | 'json' | 'text'
  placeholder?: string
  editorClassName?: string
  throttleDelay?: number
  onUpdate?: (content: Content) => void
  onBlur?: (content: Content) => void
}

const createExtensions = (placeholder: string) => [
  StarterKit.configure({
    horizontalRule: false,
    codeBlock: false,
    paragraph: { HTMLAttributes: { class: 'text-node' } },
    heading: { HTMLAttributes: { class: 'heading-node' } },
    blockquote: { HTMLAttributes: { class: 'block-node' } },
    bulletList: { HTMLAttributes: { class: 'list-node' } },
    orderedList: { HTMLAttributes: { class: 'list-node' } },
    code: { HTMLAttributes: { class: 'inline', spellcheck: 'false' } },
    dropcursor: { width: 2, class: 'ProseMirror-dropcursor border' },
  }),
  Link,
  Underline,
  Image.configure({
    allowedMimeTypes: ['image/*'],
    maxFileSize: 5 * 1024 * 1024,
    allowBase64: true,
    uploadFn: async file => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      const src = await fileToBase64(file)
      return { id: randomId(), src }
    },
    onToggle: (editor, files, pos) => {
      editor.commands.insertContentAt(
        pos,
        files.map(image => {
          const blobUrl = URL.createObjectURL(image)
          const id = randomId()

          return {
            type: 'image',
            attrs: {
              id,
              src: blobUrl,
              alt: image.name,
              title: image.name,
              fileName: image.name,
            },
          }
        }),
      )
    },
    onImageRemoved: noop,
    onValidationError: errors => {
      errors.forEach(error => {
        toast.error('Image validation error', {
          position: 'bottom-right',
          description: error.reason,
        })
      })
    },
    onActionSuccess: ({ action }) => {
      const mapping = {
        copyImage: 'Copy Image',
        copyLink: 'Copy Link',
        download: 'Download',
      }
      toast.success(mapping[action], {
        position: 'bottom-right',
        description: 'Image action success',
      })
    },
    onActionError: (error, { action }) => {
      const mapping = {
        copyImage: 'Copy Image',
        copyLink: 'Copy Link',
        download: 'Download',
      }
      toast.error(`Failed to ${mapping[action]}`, {
        position: 'bottom-right',
        description: error.message,
      })
    },
  }),
  FileHandler.configure({
    allowBase64: true,
    allowedMimeTypes: ['image/*'],
    maxFileSize: 5 * 1024 * 1024,
    onDrop: (editor, files, pos) => {
      const onDrop = async () => {
        for (const file of files) {
          const src = await fileToBase64(file)
          editor.commands.insertContentAt(pos, {
            type: 'image',
            attrs: { src },
          })
        }
      }
      void onDrop()
    },
    onPaste: (editor, files) => {
      const onPaste = async () => {
        for (const file of files) {
          const src = await fileToBase64(file)
          editor.commands.insertContent({
            type: 'image',
            attrs: { src },
          })
        }
      }
      void onPaste()
    },
    onValidationError: errors => {
      errors.forEach(error => {
        toast.error('Image validation error', {
          position: 'bottom-right',
          description: error.reason,
        })
      })
    },
  }),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  Placeholder.configure({ placeholder: () => placeholder }),
]

/**
 * Hook for creating a rich text editor instance using Tiptap.
 * It provides a set of extensions and configurations for the editor,
 * including support for images, links, text styles, and more.
 */
export const useRichTextEditor = ({
  editorClassName,
  onBlur,
  onUpdate,
  output = 'html',
  placeholder = '',
  throttleDelay = 0,
  value,
  ...props
}: UseRichTextEditorProps) => {
  const throttledSetValue = useThrottle((value: Content) => onUpdate?.(value), throttleDelay)

  const handleUpdate = useCallback(
    (editor: Editor) => throttledSetValue(getOutput(editor, output)),
    [output, throttledSetValue],
  )

  const handleCreate = useCallback(
    (editor: Editor) => {
      if (value && editor.isEmpty) {
        editor.commands.setContent(value)
      }
    },
    [value],
  )

  const handleBlur = useCallback((editor: Editor) => onBlur?.(getOutput(editor, output)), [output, onBlur])

  const editor = useEditor({
    extensions: createExtensions(placeholder),
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: cn('focus:outline-none', editorClassName),
      },
    },
    immediatelyRender: !isServer(),
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  })

  return editor
}
