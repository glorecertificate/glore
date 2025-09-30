import { RichTextEditorProvider } from '@/components/blocks/rich-text-editor'

export default ({ children }: LayoutProps<'/certificates'>) => (
  <RichTextEditorProvider>{children}</RichTextEditorProvider>
)
