'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const TRIGGER_CLASS_NAME =
  'inline-flex shrink-0 touch-hit cursor-pointer items-center justify-center rounded-full text-foreground/60 outline-none hover:text-foreground focus-visible:focus-ring data-[state=open]:text-foreground'

const stop = (event: React.SyntheticEvent) => event.stopPropagation()

export const InfoTip = ({
  children,
  className,
  contentClassName,
  icon = 'info',
  iconClassName,
  label,
  nested = false,
  side,
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  icon?: React.ComponentProps<typeof LucideIcon>['name']
  iconClassName?: string
  label?: string
  nested?: boolean
  side?: React.ComponentProps<typeof PopoverContent>['side']
}) => {
  const t = useTranslations('Components.InfoTip')
  const name = label ?? t('label')
  const iconNode = <LucideIcon className={cn('size-3.5', iconClassName)} name={icon} />

  return (
    <Popover>
      {nested ? (
        <>
          <span className="sr-only">{name}</span>
          <PopoverTrigger asChild>
            <span
              aria-hidden
              className={cn(TRIGGER_CLASS_NAME, 'z-10', className)}
              data-slot="info-tip"
              onPointerDown={stop}
              tabIndex={-1}
            >
              {iconNode}
            </span>
          </PopoverTrigger>
        </>
      ) : (
        <PopoverTrigger
          aria-label={name}
          className={cn(TRIGGER_CLASS_NAME, className)}
          data-slot="info-tip"
          type="button"
        >
          {iconNode}
        </PopoverTrigger>
      )}
      <PopoverContent
        aria-label={name}
        className={cn('w-auto max-w-72 px-3 py-2 text-sm text-pretty', contentClassName)}
        onClick={stop}
        onPointerDown={stop}
        side={side}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
