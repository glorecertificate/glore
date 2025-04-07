import { AppLink } from '@/components/layout/app-link'
import { Button, type ButtonProps } from '@/components/ui/button'
import { type Path } from '@/lib/navigation'
import { type ColorVariant } from '@/lib/theme'

export interface AppButtonProps extends ButtonProps {
  color?: ColorVariant
  to: Path
}

export const AppButton = ({ children, color, size, to, ...props }: AppButtonProps) => (
  <AppLink color={color} to={to}>
    <Button {...props}>{children}</Button>
  </AppLink>
)
