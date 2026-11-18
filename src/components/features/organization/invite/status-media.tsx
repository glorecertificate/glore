import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { cn } from '@/lib/utils'

export type ClosedStatus = 'accepted' | 'declined' | 'exhausted' | 'expired' | 'invalid' | 'member' | 'revoked'

type Tone = 'neutral' | 'success' | 'warning'

export const STATUS_MEDIA: Record<ClosedStatus, { icon: IconName; tone: Tone }> = {
  accepted: { icon: 'circle-check', tone: 'success' },
  declined: { icon: 'circle-x', tone: 'neutral' },
  exhausted: { icon: 'circle-alert', tone: 'warning' },
  expired: { icon: 'alarm-clock', tone: 'warning' },
  invalid: { icon: 'search-x', tone: 'neutral' },
  member: { icon: 'circle-check', tone: 'success' },
  revoked: { icon: 'circle-x', tone: 'neutral' },
}

const TONES = {
  neutral: 'bg-surface-muted text-muted-foreground',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
} satisfies Record<Tone, string>

export const StatusMedia = ({ icon, tone }: { icon: IconName; tone: Tone }) => (
  <div aria-hidden className={cn('flex size-16 items-center justify-center rounded-full', TONES[tone])}>
    <LucideIcon className="size-8" name={icon} />
  </div>
)
