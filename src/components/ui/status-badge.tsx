import { type IconName } from '@/components/icons/registry'
import { Badge, type BadgeVariant } from '@/components/ui/badge'

const STATUS_TONES = {
  approved: 'approved',
  changes: 'changes',
  danger: 'destructive',
  draft: 'draft',
  info: 'info',
  neutral: 'muted',
  rejected: 'rejected',
  review: 'review',
  revoked: 'revoked',
  submitted: 'submitted',
  success: 'success',
  warning: 'warning',
  withdrawn: 'withdrawn',
} as const satisfies Record<string, BadgeVariant>

export type StatusTone = keyof typeof STATUS_TONES

export interface StatusMeta {
  icon: IconName
  labelKey: string
  tone: StatusTone
}

interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  tone: StatusTone
}

export const StatusBadge = ({ children, tone, ...props }: StatusBadgeProps) => (
  <Badge data-tone={tone} variant={STATUS_TONES[tone]} {...props}>
    {children}
  </Badge>
)
