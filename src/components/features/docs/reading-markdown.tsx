import { readingComponents } from '@/components/features/docs/reading-components'
import Markdown from '@/components/ui/markdown'

interface ReadingMarkdownProps {
  children: string
  ids: Record<number, string>
}

export const ReadingMarkdown = ({ children, ids }: ReadingMarkdownProps) => (
  <Markdown className="text-base/7 text-fg-1" components={readingComponents(ids)}>
    {children}
  </Markdown>
)
