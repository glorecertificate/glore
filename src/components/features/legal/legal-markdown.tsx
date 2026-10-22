import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const COMPONENTS = {
  a: ({ children, href }) =>
    href?.startsWith('http') ? (
      <a className="font-medium underline underline-offset-4" href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    ) : (
      <a className="font-medium underline underline-offset-4" href={href}>
        {children}
      </a>
    ),
  h1: ({ children, ...props }) => (
    <h1 className="mt-10 text-3xl font-semibold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-10 text-xl font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 text-lg font-semibold" {...props}>
      {children}
    </h3>
  ),
  li: props => <li className="pl-1" {...props} />,
  ol: props => <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />,
  p: props => <p className="my-4 leading-relaxed text-foreground/90" {...props} />,
  table: props => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  td: props => <td className="border-b px-3 py-2 align-top" {...props} />,
  th: props => <th className="border-b px-3 py-2 font-medium" {...props} />,
  ul: props => <ul className="my-4 list-disc space-y-2 pl-6" {...props} />,
} satisfies Components

export const LegalMarkdown = ({ children }: { children: string }) => (
  <Markdown components={COMPONENTS} remarkPlugins={[remarkGfm]}>
    {children}
  </Markdown>
)
