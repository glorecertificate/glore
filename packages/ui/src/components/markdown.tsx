import ReactMarkdown from 'react-markdown'

import { cn } from '@repo/ui/utils'

export interface MarkdownProps extends React.ComponentProps<'div'> {
  children?: string | null
}

export const Markdown = ({ children, className, ...props }: MarkdownProps) => (
  <div className={cn('markdown', className)} {...props}>
    <ReactMarkdown children={children} />
  </div>
)
