'use client'

import { InfoIcon } from 'lucide-react'

import { type IconName } from '@/components/icons/dynamic'
import { BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePortal } from '@/hooks/use-portal'
import { cn } from '@/lib/utils'

export interface SectionLayoutProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  description?: React.ReactNode
  icon?: IconName
  title: React.ReactNode
}

export const SectionLayout = ({ children, className, description, icon, title, ...props }: SectionLayoutProps) => {
  const Breadcrumb = usePortal('breadcrumb')

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-1">
          <BreadcrumbItem className="flex items-center gap-1.5 text-base text-foreground leading-[inherit]">
            {title}
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-3.5 cursor-help text-foreground/60" />
                </TooltipTrigger>
                <TooltipContent className="text-[13px]" showArrow>
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className={cn('flex h-full flex-col gap-3', className)} {...props}>
        {children}
      </div>
    </>
  )
}
