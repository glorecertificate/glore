import { RichTextEditorProvider } from '@repo/ui/blocks/rich-text-editor'

export default ({ children }: LayoutProps<'/certificates'>) => (
  <RichTextEditorProvider>{children}</RichTextEditorProvider>
)
