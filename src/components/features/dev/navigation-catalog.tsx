import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = ['overview', 'members', 'settings'] as const

export const NavigationCatalog = () => (
  <CatalogSection id="tabs" name="Tabs">
    <CatalogRow label="default">
      <Tabs defaultValue={TABS[0]}>
        <TabsList>
          {TABS.map(tab => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </CatalogRow>
    <CatalogRow label="count, disabled">
      <Tabs defaultValue={TABS[0]}>
        <TabsList>
          <TabsTrigger value={TABS[0]}>{TABS[0]}</TabsTrigger>
          <TabsTrigger count={12} value={TABS[1]}>
            {TABS[1]}
          </TabsTrigger>
          <TabsTrigger disabled value={TABS[2]}>
            {TABS[2]}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </CatalogRow>
  </CatalogSection>
)
