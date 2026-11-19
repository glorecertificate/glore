'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'

interface SectionNavItem {
  href?: Route
  icon?: IconName
  id: string
  label: string
}

interface SectionNavProps extends Omit<React.ComponentProps<'nav'>, 'onChange'> {
  items: SectionNavItem[]
  onValueChange?: (id: string) => void
  value: string
}

const ITEM =
  'inline-flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium whitespace-nowrap text-fg-2 transition-colors duration-100 outline-none hover:bg-surface-hover hover:text-fg-1 focus-visible:focus-ring-inset aria-[current=true]:bg-action-subtle aria-[current=true]:font-semibold aria-[current=true]:text-fg-title'

export const SectionNav = ({ className, items, onValueChange, value, ...props }: SectionNavProps) => {
  const t = useTranslations('Common')

  return (
    <nav
      aria-label={t('sections')}
      className={cn(
        '-mx-4 scrollbar-hide flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:w-52 md:shrink-0 md:flex-col md:overflow-visible md:px-0 md:pb-0',
        className
      )}
      data-slot="section-nav"
      {...props}
    >
      {items.map(item => {
        const current = item.id === value
        const content = (
          <>
            {item.icon && <LucideIcon className="size-4 shrink-0" name={item.icon} />}
            {item.label}
          </>
        )

        if (item.href) {
          return (
            <Link
              aria-current={current ? 'true' : undefined}
              className={ITEM}
              href={item.href}
              key={item.id}
              onClick={() => onValueChange?.(item.id)}
            >
              {content}
            </Link>
          )
        }

        return (
          <button
            aria-current={current ? 'true' : undefined}
            className={ITEM}
            key={item.id}
            onClick={() => onValueChange?.(item.id)}
            type="button"
          >
            {content}
          </button>
        )
      })}
    </nav>
  )
}
