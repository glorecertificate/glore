import { type Value } from 'platejs'
import { createStaticEditor } from 'platejs/static'

import { StaticEditor } from '@/components/ui/rich-text-editor/components/static-editor'
import { BaseEditorKit } from '@/components/ui/rich-text-editor/plugins/editor-base'

export const LessonBody = ({ content }: { content: unknown[] }) => (
  <StaticEditor
    className="cursor-auto text-base"
    editor={createStaticEditor({ plugins: BaseEditorKit, value: content as Value })}
  />
)
