import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { type IconName } from '@/components/icons/registry'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { KbdShortcut } from '@/components/ui/kbd-shortcut'
import { StatusBadge, type StatusMeta } from '@/components/ui/status-badge'
import { SHORTCUTS } from '@/lib/shortcuts'

const VARIANTS = [
  'primary',
  'muted',
  'outline',
  'ghost',
  'brand',
  'brand-soft',
  'success',
  'warning',
  'destructive',
  'info',
] as const satisfies BadgeVariant[]

const SIZES = ['sm', 'default', 'lg'] as const satisfies NonNullable<React.ComponentProps<typeof Badge>['size']>[]

const TONES = [
  { icon: 'circle-dashed', tone: 'neutral' },
  { icon: 'info', tone: 'info' },
  { icon: 'circle-check', tone: 'success' },
  { icon: 'circle-alert', tone: 'warning' },
  { icon: 'circle-x', tone: 'danger' },
] as const satisfies { icon: IconName; tone: StatusMeta['tone'] }[]

export const BadgeCatalog = () => (
  <>
    <CatalogSection id="badge" name="Badge">
      <CatalogRow label="variant">
        {VARIANTS.map(variant => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </CatalogRow>
      <CatalogRow label="size">
        {SIZES.map(size => (
          <Badge key={size} size={size} variant="outline">
            {size}
          </Badge>
        ))}
      </CatalogRow>
      <CatalogRow label="count">
        {SIZES.map(size =>
          [3, 53, 120].map(count => <Badge count={count} key={`${size}-${count}`} size={size} variant="brand" />)
        )}
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="status-badge" name="StatusBadge">
      <CatalogRow label="tone">
        {TONES.map(({ icon, tone }) => (
          <StatusBadge icon={icon} key={tone} tone={tone}>
            {tone}
          </StatusBadge>
        ))}
      </CatalogRow>
      <CatalogRow label="tone (no icon)">
        {TONES.map(({ tone }) => (
          <StatusBadge key={tone} tone={tone}>
            {tone}
          </StatusBadge>
        ))}
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="kbd" name="Kbd">
      <CatalogRow label="Kbd">
        <Kbd>{'Esc'}</Kbd>
        <Kbd>{'K'}</Kbd>
      </CatalogRow>
      <CatalogRow label="KbdGroup">
        <KbdGroup>
          <Kbd>{'Shift'}</Kbd>
          <Kbd>{'K'}</Kbd>
        </KbdGroup>
      </CatalogRow>
      <CatalogRow label="KbdShortcut">
        <KbdShortcut shortcut={SHORTCUTS.search} />
        <KbdShortcut shortcut={SHORTCUTS.sidebar} />
        <KbdShortcut shortcut={SHORTCUTS.filter} />
      </CatalogRow>
    </CatalogSection>
  </>
)
