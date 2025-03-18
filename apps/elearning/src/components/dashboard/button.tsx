import { DashboardLink, type DashboardLinkProps } from '@/components/dashboard/link'
import { Button, type ButtonProps } from '@/components/ui/button'

export const DashboardButton = ({ children, color, disabled, iconSize, to, ...props }: DashboardLinkProps & ButtonProps) => (
  <Button asChild {...props}>
    <DashboardLink className="hover:no-underline" color={color} iconSize={iconSize} to={to}>
      {children}
    </DashboardLink>
  </Button>
)
