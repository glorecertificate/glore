import { ICONS, type IconName, isIconName } from '@/components/icons/registry'
import { type IconProps } from '@/lib/types'

const FALLBACK_ICON: IconName = 'circle-help'

export const LucideIcon = ({ name, ...props }: IconProps<{ name: IconName }>) => {
  const Icon = ICONS[isIconName(name) ? name : FALLBACK_ICON]

  return <Icon {...props} />
}
