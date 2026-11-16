import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Badge, type BadgeVariant } from '@/components/ui/badge'

const STATUS_TONES = {
  danger: 'destructive',
  info: 'info',
  neutral: 'muted',
  success: 'success',
  warning: 'warning',
} as const satisfies Record<string, BadgeVariant>

type StatusTone = keyof typeof STATUS_TONES

export interface StatusMeta {
  icon: IconName
  labelKey: string
  tone: StatusTone
}

interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  icon?: IconName
  tone: StatusTone
}

export const StatusBadge = ({ children, icon, tone, ...props }: StatusBadgeProps) => (
  <Badge data-tone={tone} variant={STATUS_TONES[tone]} {...props}>
    {icon && <LucideIcon aria-hidden name={icon} />}
    {children}
  </Badge>
)
