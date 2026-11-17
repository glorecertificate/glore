import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const SIZES = ['xs', 'sm', 'md', 'lg'] as const satisfies NonNullable<React.ComponentProps<typeof Input>['size']>[]

const OPTIONS = ['learner', 'tutor', 'editor'] as const

const CatalogSelect = ({ size, ...props }: React.ComponentProps<typeof SelectTrigger>) => (
  <Select defaultValue={OPTIONS[0]}>
    <SelectTrigger aria-label={size ?? 'select'} className="w-36" size={size} {...props}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {OPTIONS.map(option => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

export const FieldCatalog = () => (
  <>
    <CatalogSection id="input" name="Input">
      <CatalogRow label="size">
        {SIZES.map(size => (
          <Input aria-label={size} className="w-36" key={size} placeholder={size} size={size} />
        ))}
      </CatalogRow>
      <CatalogRow label="icon">
        <Input aria-label="search" className="w-56" icon="search" placeholder="search" />
      </CatalogRow>
      <CatalogRow label="value">
        <Input aria-label="value" className="w-56" defaultValue="ada@glore.test" />
      </CatalogRow>
      <CatalogRow label="disabled">
        <Input aria-label="disabled" className="w-56" defaultValue="disabled" disabled />
      </CatalogRow>
      <CatalogRow label="aria-invalid">
        <Input aria-invalid aria-label="aria-invalid" className="w-56" defaultValue="invalid" />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="textarea" name="Textarea">
      <CatalogRow label="default">
        <Textarea aria-label="default" className="max-w-md" placeholder="placeholder" />
      </CatalogRow>
      <CatalogRow label="disabled">
        <Textarea aria-label="disabled" className="max-w-md" defaultValue="disabled" disabled />
      </CatalogRow>
      <CatalogRow label="aria-invalid">
        <Textarea aria-invalid aria-label="aria-invalid" className="max-w-md" defaultValue="invalid" />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="select" name="Select">
      <CatalogRow label="size">
        {SIZES.map(size => (
          <CatalogSelect key={size} size={size} />
        ))}
      </CatalogRow>
      <CatalogRow label="disabled">
        <CatalogSelect disabled />
      </CatalogRow>
      <CatalogRow label="aria-invalid">
        <CatalogSelect aria-invalid />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="choice" name="Checkbox, Switch, RadioGroup">
      <CatalogRow label="Checkbox">
        <Checkbox aria-label="unchecked" />
        <Checkbox aria-label="checked" defaultChecked />
        <Checkbox aria-label="disabled" disabled />
        <Checkbox aria-label="disabled checked" defaultChecked disabled />
        <Checkbox aria-invalid aria-label="aria-invalid" />
      </CatalogRow>
      <CatalogRow label="Switch">
        <Switch aria-label="off" />
        <Switch aria-label="on" defaultChecked />
        <Switch aria-label="disabled" disabled />
        <Switch aria-label="disabled on" defaultChecked disabled />
      </CatalogRow>
      <CatalogRow label="RadioGroup">
        <RadioGroup aria-label="RadioGroup" className="flex gap-4" defaultValue={OPTIONS[0]}>
          {OPTIONS.map(option => (
            <RadioGroupItem aria-label={option} key={option} value={option} />
          ))}
          <RadioGroupItem aria-label="disabled" disabled value="disabled" />
        </RadioGroup>
      </CatalogRow>
      <CatalogRow label="SegmentedControl">
        <SegmentedControl aria-label="SegmentedControl" defaultValue={OPTIONS[0]}>
          {OPTIONS.map(option => (
            <SegmentedControlItem key={option} value={option}>
              {option}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </CatalogRow>
    </CatalogSection>
  </>
)
