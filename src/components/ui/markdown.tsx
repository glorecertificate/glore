'use client'

import dynamic from 'next/dynamic'

import { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

const isExternal = (href?: string) => Boolean(href?.startsWith('http'))

const COMPONENTS = {
  a: ({ children, href }) => (
    <a
      className="font-medium text-brand-text underline underline-offset-4 hover:text-brand-text/80"
      href={href}
      {...(isExternal(href) && { rel: 'noopener noreferrer', target: '_blank' })}
    >
      {children}
    </a>
  ),
  blockquote: props => <blockquote className="my-4 border-l-2 pl-4 text-muted-foreground italic" {...props} />,
  code: ({ className, ...props }) => (
    <code
      className={cn(
        !className?.includes('language-') && 'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]',
        className
      )}
      {...props}
    />
  ),
  h1: ({ children, ...props }) => (
    <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight text-balance" {...props}>
      {children}
    </h2>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-8 mb-3 text-xl font-semibold tracking-tight text-balance" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-balance" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-5 mb-2 font-semibold" {...props}>
      {children}
    </h4>
  ),
  hr: props => <hr className="my-8 border-border" {...props} />,
  img: ({ alt, src }) => (
    <img alt={alt ?? ''} className="my-4 h-auto max-w-full rounded-lg border" loading="lazy" src={src} />
  ),
  li: props => <li className="pl-1 marker:text-muted-foreground" {...props} />,
  ol: props => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
  p: props => <p className="my-4 leading-relaxed" {...props} />,
  pre: props => (
    <pre
      className="my-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  strong: props => <strong className="font-semibold" {...props} />,
  table: props => (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  td: props => <td className="border-b px-3 py-2 align-top" {...props} />,
  th: props => <th className="border-b bg-muted/40 px-3 py-2 font-medium" {...props} />,
  ul: props => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
} satisfies Components

export const Markdown = ({
  className,
  components,
  ...props
}: React.PropsWithChildren<Options> & { className?: string }) => (
  <div className={cn('markdown min-w-0 wrap-break-word [&>:first-child]:mt-0 [&>:last-child]:mb-0', className)}>
    <ReactMarkdown components={{ ...COMPONENTS, ...components }} remarkPlugins={[remarkGfm]} {...props} />
  </div>
)
