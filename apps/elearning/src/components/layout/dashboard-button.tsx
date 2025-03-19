import { DashboardLink, type DashboardLinkProps } from '@/components/layout/dashboard-link'
import { Button, type ButtonProps } from '@/components/ui/button'

export const DashboardButton = ({ children, color, hasLoader, iconSize, to, ...props }: DashboardLinkProps & ButtonProps) => (
  <DashboardLink color={color} hasLoader={hasLoader} iconSize={iconSize} to={to}>
    <Button {...props}>{children}</Button>
  </DashboardLink>
)
