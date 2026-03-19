import dynamic from 'next/dynamic'

import { type Options } from 'react-markdown'

import { cn } from '@/lib/utils'

export interface MarkdownProps extends React.PropsWithChildren<Options> {
  className?: string
}

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

export const Markdown = ({ className, ...props }: MarkdownProps) => (
  <div className={cn('markdown', className)}>
    <ReactMarkdown {...props} />
  </div>
)
