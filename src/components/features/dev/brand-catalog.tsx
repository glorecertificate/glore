import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { Button } from '@/components/ui/button'
import { PageBand } from '@/components/ui/page-band'
import { STAT_ACCENTS, StatCard } from '@/components/ui/stat-card'
import { cn } from '@/lib/utils'

const SWATCHES = [
  { className: 'bg-canvas text-fg-1', label: 'canvas' },
  { className: 'bg-card text-card-foreground', label: 'card' },
  { className: 'bg-sidebar text-sidebar-foreground', label: 'sidebar' },
  { className: 'bg-band text-band-foreground', label: 'bg-band' },
  { className: 'bg-gradient-action text-fg-on-dark', label: 'bg-gradient-action' },
  { className: 'bg-highlight text-highlight-foreground', label: 'bg-highlight' },
  { className: 'bg-earned-panel text-fg-on-dark', label: 'bg-earned-panel' },
  { className: 'bg-pill-approved text-pill-approved-foreground', label: 'pill-approved' },
  { className: 'bg-pill-review text-pill-review-foreground', label: 'pill-review' },
  { className: 'bg-pill-draft text-pill-draft-foreground', label: 'pill-draft' },
]

const ACCENTS = Object.keys(STAT_ACCENTS) as (keyof typeof STAT_ACCENTS)[]

const SHADOWS = ['shadow-card', 'shadow-stat', 'shadow-glow', 'shadow-glow-nav', 'shadow-glow-green', 'shadow-deep']

export const BrandCatalog = () => (
  <CatalogSection id="brand" name="Brand-forward tokens">
    <CatalogRow label="surfaces and gradients">
      {SWATCHES.map(({ className, label }) => (
        <div className={cn('flex h-16 w-40 items-end rounded-xl border p-2 font-mono text-xs', className)} key={label}>
          {label}
        </div>
      ))}
    </CatalogRow>
    <CatalogRow label="shadow-*">
      {SHADOWS.map(shadow => (
        <div
          className={cn('flex h-14 w-32 items-center justify-center rounded-xl bg-card text-xs', shadow)}
          key={shadow}
        >
          {shadow}
        </div>
      ))}
    </CatalogRow>
    <CatalogRow label="StatCard accent">
      {ACCENTS.map(accent => (
        <StatCard
          accent={accent}
          className="w-56"
          description="description"
          icon="award"
          key={accent}
          label={accent}
          value={328}
        />
      ))}
    </CatalogRow>
    <CatalogRow label="Button band, band-secondary">
      <div className="flex w-full flex-wrap gap-2 rounded-xl bg-band p-4">
        <Button variant="band">{'band'}</Button>
        <Button variant="band-secondary">{'band-secondary'}</Button>
      </div>
    </CatalogRow>
    <CatalogRow label="PageBand">
      <div className="relative w-full overflow-hidden rounded-xl">
        <PageBand>
          <h2 className="type-band">{'PageBand'}</h2>
          <p className="text-base text-band-text">{'Title, description and actions sit on the gradient.'}</p>
        </PageBand>
      </div>
    </CatalogRow>
  </CatalogSection>
)
