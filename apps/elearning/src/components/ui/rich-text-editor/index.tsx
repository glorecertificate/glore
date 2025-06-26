import './styles.css'

import { useCallback } from 'react'

import { EditorContent, type Content, type Editor } from '@tiptap/react'

import { Separator } from '@/components/ui/separator'
import { useRichTextEditor, type UseRichTextEditorProps } from '@/hooks/use-rich-text-editor'
import { cn } from '@/lib/utils'

import { LinkBubbleMenu } from './components/link-bubble-menu'
import { MeasuredContainer } from './components/measured-container'
import { SectionOne } from './components/sections/section1'
import { SectionTwo } from './components/sections/section2'
import { SectionThree } from './components/sections/section3'
import { SectionFour } from './components/sections/section4'
import { SectionFive } from './components/sections/section5'

export interface RichTextEditorProps extends Omit<UseRichTextEditorProps, 'onUpdate'> {
  value?: Content
  onChange?: (value: Content) => void
  className?: string
  editorContentClassName?: string
}

const Toolbar = ({ editor }: { editor: Editor }) => (
  <div className="shrink-0 overflow-x-auto border-b border-border px-4 py-2">
    <div className="flex w-max items-center gap-px">
      <SectionOne activeLevels={[1, 2, 3, 4, 5, 6]} editor={editor} />
      <Separator className="mx-2 h-7" orientation="vertical" />
      <SectionTwo
        activeActions={['bold', 'italic', 'underline', 'strikethrough', 'code', 'clearFormatting']}
        editor={editor}
        mainActionCount={3}
      />
      <Separator className="mx-2 h-7" orientation="vertical" />
      <SectionThree editor={editor} />
      <Separator className="mx-2 h-7" orientation="vertical" />
      <SectionFour activeActions={['orderedList', 'bulletList']} editor={editor} mainActionCount={0} />
      <Separator className="mx-2 h-7" orientation="vertical" />
      <SectionFive activeActions={['codeBlock', 'blockquote', 'horizontalRule']} editor={editor} mainActionCount={0} />
    </div>
  </div>
)

export const RichTextEditor = ({
  className,
  editorContentClassName,
  onChange,
  value,
  ...props
}: RichTextEditorProps) => {
  const editor = useRichTextEditor({
    value,
    onUpdate: onChange,
    ...props,
  })

  const onContentClick = useCallback(() => {
    if (editor) {
      editor.chain().focus().run()
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <MeasuredContainer
      as="div"
      className={cn(
        'flex h-auto min-h-72 w-full flex-col rounded-md border transition-colors focus-within:border-ring',
        className,
      )}
      name="editor"
    >
      <Toolbar editor={editor} />
      <EditorContent
        className={cn('rich-text-editor grow', editorContentClassName)}
        editor={editor}
        onClick={onContentClick}
      />
      <LinkBubbleMenu editor={editor} />
    </MeasuredContainer>
  )
}
