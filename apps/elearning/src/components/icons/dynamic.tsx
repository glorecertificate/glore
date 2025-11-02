import { type JSX } from 'react'

import { DynamicIcon as LucideDynamic, type IconName as LucideIcon } from 'lucide-react/dynamic'

import { type IconProps } from '@/components/icons/types'
import { cn } from '@/lib/utils'

export type IconName = LucideIcon

export type DynamicIconProps = IconProps<{
  fallback?: () => JSX.Element
  name: IconName
  placeholder?: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  placeholderProps?: React.HTMLAttributes<HTMLElement>
}>

export const DynamicIcon = ({
  className,
  placeholder: Placeholder,
  placeholderProps = {},
  ...props
}: DynamicIconProps) => {
  if (!Placeholder) return <LucideDynamic {...props} />

  const { className: placeholderClassName, ...rest } = placeholderProps

  return (
    <>
      <LucideDynamic className={cn('peer', className)} {...props} />
      <Placeholder className={cn('peer-has-[*]:hidden', placeholderClassName)} {...rest} />
    </>
  )
}
