import { type Components } from 'react-markdown'

import { cn } from '@/lib/utils'

const anchor = (ids: Record<number, string>, node?: { position?: { start: { line: number } } }) =>
  node?.position ? ids[node.position.start.line] : undefined

export const readingComponents = (ids: Record<number, string> = {}): Components => ({
  blockquote: props => (
    <blockquote className="my-6 border-l-2 border-border-strong pl-4 text-fg-2 [&>p]:my-2" {...props} />
  ),
  h1: ({ children, node }) => (
    <h2
      className="mt-12 mb-4 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-balance text-fg-title"
      id={anchor(ids, node)}
    >
      {children}
    </h2>
  ),
  h2: ({ children, node }) => (
    <h2
      className="mt-12 mb-4 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-balance text-fg-title"
      id={anchor(ids, node)}
    >
      {children}
    </h2>
  ),
  h3: ({ children, node }) => (
    <h3
      className="mt-8 mb-3 scroll-mt-24 font-display text-lg font-semibold tracking-tight text-balance text-fg-1"
      id={anchor(ids, node)}
    >
      {children}
    </h3>
  ),
  hr: props => <hr className="my-10 border-border" {...props} />,
  li: props => <li className="pl-1 marker:text-fg-3" {...props} />,
  ol: ({ className, ...props }) => <ol className={cn('my-5 list-decimal space-y-2 pl-6', className)} {...props} />,
  p: props => <p className="my-5 text-pretty" {...props} />,
  ul: ({ className, ...props }) => <ul className={cn('my-5 list-disc space-y-2 pl-6', className)} {...props} />,
})
