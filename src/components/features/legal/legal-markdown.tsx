import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { readingComponents } from '@/components/features/docs/reading-components'

const LINK = 'font-medium text-link underline underline-offset-4 hover:text-brand-text'

const components = (ids: Record<number, string>) =>
  ({
    ...readingComponents(ids),
    a: ({ children, href }) =>
      href?.startsWith('http') ? (
        <a className={LINK} href={href} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <a className={LINK} href={href}>
          {children}
        </a>
      ),
    table: props => (
      <div className="my-6 overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-left text-sm" {...props} />
      </div>
    ),
    td: props => <td className="border-b px-3 py-2 align-top text-fg-1" {...props} />,
    th: props => <th className="border-b bg-surface-muted px-3 py-2 font-medium text-fg-1" {...props} />,
  }) satisfies Components

const NO_IDS: Record<number, string> = {}

interface LegalMarkdownProps {
  children: string
  ids?: Record<number, string>
}

export const LegalMarkdown = ({ children, ids = NO_IDS }: LegalMarkdownProps) => (
  <div className="text-base/7 text-fg-1 [&>:first-child]:mt-0">
    <Markdown components={components(ids)} remarkPlugins={[remarkGfm]}>
      {children}
    </Markdown>
  </div>
)
