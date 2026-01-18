import ReactMarkdown, { type Options } from 'react-markdown'

import { cn } from '@/lib/utils'

export interface MarkdownProps extends React.PropsWithChildren<Options> {
  className?: string
}

export const Markdown = ({ className, ...props }: MarkdownProps) => (
  <div className={cn('markdown', className)}>
    <ReactMarkdown {...props} />
  </div>
)
