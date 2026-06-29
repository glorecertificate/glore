'use client'

import { useState } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface FaqItem {
  answer: string
  question: string
}

export const Faq = ({ className, items, ...props }: React.ComponentProps<'div'> & { items: FaqItem[] }) => {
  const [open, setOpen] = useState<string | null>(items[0]?.question ?? null)

  return (
    <div className={cn('divide-y rounded-xl border bg-card shadow-2xs', className)} {...props}>
      {items.map(({ answer, question }) => {
        const isOpen = open === question

        return (
          <Collapsible key={question} onOpenChange={value => setOpen(value ? question : null)} open={isOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/50">
              <span className="text-sm font-medium">{question}</span>
              <ChevronDownIcon
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              forceMount
              className="grid transition-[grid-template-rows] duration-200 ease-out data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]"
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
