import { type ReadingHeading } from '@/components/features/docs/headings'
import { cn } from '@/lib/utils'

export const TocLinks = ({ headings }: { headings: ReadingHeading[] }) => (
  <ol className="flex flex-col gap-0.5 border-l border-border-subtle text-sm">
    {headings.map(({ id, level, text }) => (
      <li key={id}>
        <a
          className={cn(
            '-ml-px block border-l border-transparent py-1 pr-2 text-fg-2 transition-colors hover:border-border-strong hover:text-fg-1 focus-visible:text-fg-1 focus-visible:focus-ring-inset',
            level === 3 ? 'pl-6' : 'pl-3'
          )}
          href={`#${id}`}
        >
          {text}
        </a>
      </li>
    ))}
  </ol>
)
