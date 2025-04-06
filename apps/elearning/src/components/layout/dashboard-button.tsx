import { useMemo } from 'react'

import { DashboardLink, type DashboardLinkProps } from '@/components/layout/dashboard-link'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface DashboardButtonProps extends Omit<DashboardLinkProps, 'color'>, ButtonProps {}

export const DashboardButton = ({ children, hasLoader = false, size, to, ...props }: DashboardButtonProps) => {
  const iconSize = useMemo(() => {
    switch (size) {
      case 'sm':
        return 10
      case 'lg':
        return 20
      default:
        return 4
    }
  }, [size])

  return (
    <DashboardLink hasLoader={hasLoader} iconSize={iconSize} to={to}>
      <Button {...props}>{children}</Button>
    </DashboardLink>
  )
}
