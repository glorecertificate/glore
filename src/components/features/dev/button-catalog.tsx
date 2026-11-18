import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { Button, type ButtonProps } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'

const VARIANTS = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
  'warning',
  'success',
  'brand',
  'brand-secondary',
  'brand-tertiary',
] as const satisfies NonNullable<ButtonProps['variant']>[]

const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg'] as const satisfies NonNullable<ButtonProps['size']>[]

const ICON_SIZES = ['icon-2xs', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const satisfies NonNullable<
  ButtonProps['size']
>[]

const STATE_VARIANTS = ['primary', 'outline', 'ghost', 'destructive'] as const satisfies NonNullable<
  ButtonProps['variant']
>[]

export const ButtonCatalog = () => (
  <CatalogSection id="button" name="Button">
    <CatalogRow label="variant">
      {VARIANTS.map(variant => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </CatalogRow>
    <CatalogRow label="size">
      {SIZES.map(size => (
        <Button icon="plus" key={size} size={size} variant="outline">
          {size}
        </Button>
      ))}
    </CatalogRow>
    <CatalogRow label="size (icon)">
      {ICON_SIZES.map(size => (
        <Button aria-label={size} icon="download" key={size} size={size} variant="outline" />
      ))}
    </CatalogRow>
    <CatalogRow label="iconPlacement">
      <Button icon="download" iconPlacement="left" variant="outline">
        {'left'}
      </Button>
      <Button icon="arrow-right" iconPlacement="right" variant="outline">
        {'right'}
      </Button>
    </CatalogRow>
    <CatalogRow label="disabled">
      {STATE_VARIANTS.map(variant => (
        <Button disabled key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </CatalogRow>
    <CatalogRow label="loading">
      {STATE_VARIANTS.map(variant => (
        <Button key={variant} loading variant={variant}>
          {variant}
        </Button>
      ))}
    </CatalogRow>
    <CatalogRow label="CopyButton">
      <CopyButton value="https://glore.test" />
      <CopyButton iconOnly label="Copy link" value="https://glore.test" />
      <CopyButton disabled iconOnly label="Copy link" value="https://glore.test" />
    </CatalogRow>
  </CatalogSection>
)
