import dynamic from 'next/dynamic'

import { type Options } from 'react-markdown'

import { cn } from '@/lib/utils'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

export const Markdown = ({ className, ...props }: React.PropsWithChildren<Options> & { className?: string }) => (
  <div className={cn('markdown', className)}>
    <ReactMarkdown {...props} />
  </div>
)
