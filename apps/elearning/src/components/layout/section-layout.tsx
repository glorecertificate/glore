'use client'

import { InfoIcon } from 'lucide-react'

import { type IconName } from '@/components/icons/dynamic'
import { BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHeader } from '@/hooks/use-header'
import { cn } from '@/lib/utils'

export interface SectionLayoutProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  description?: React.ReactNode
  icon?: IconName
  title: React.ReactNode
}

export const SectionLayout = ({ children, className, description, icon, title, ...props }: SectionLayoutProps) => {
  useHeader(
    <BreadcrumbList className="sm:gap-1">
      <BreadcrumbItem className="flex items-center gap-1.5 text-base text-foreground leading-[inherit]">
        {title}
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-4 text-foreground/60" />
            </TooltipTrigger>
            <TooltipContent className="text-[13px]">{description}</TooltipContent>
          </Tooltip>
        )}
      </BreadcrumbItem>
    </BreadcrumbList>
  )

  return (
    <div className={cn('flex h-full flex-col gap-2', className)} {...props}>
      {children}
    </div>
  )
}
