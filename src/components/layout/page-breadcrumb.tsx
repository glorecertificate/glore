'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type MessageKey } from '@/lib/i18n'

export const PageBreadcrumb = ({
  children,
  description,
  title,
  ...props
}: React.ComponentProps<typeof Breadcrumb> & {
  description?: React.ReactNode
  title?: React.ReactNode
}) => {
  const pathname = usePathname()
  const t = useTranslations('Layout')

  const [titleKey, descriptionKey] = useMemo(() => {
    const key = pathname
      .split('/')
      .filter(Boolean)
      .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join('')
    return [key, `${key}Description`] as MessageKey<'Layout'>[]
  }, [pathname])

  const breadcrumbTitle = title ?? (t.has(titleKey) ? t(titleKey) : null)
  const breadcrumbDescription = description ?? (t.has(descriptionKey) ? t(descriptionKey) : null)

  return (
    <Breadcrumb {...props}>
      {children ?? (
        <BreadcrumbList>
          <BreadcrumbItem className="flex cursor-default items-center gap-1.5 text-[15px] text-foreground leading-[inherit]">
            {breadcrumbTitle}
            {breadcrumbDescription && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-3.5 cursor-help text-foreground/60" />
                </TooltipTrigger>
                <TooltipContent className="text-[13px]" showArrow>
                  {breadcrumbDescription}
                </TooltipContent>
              </Tooltip>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      )}
    </Breadcrumb>
  )
}
