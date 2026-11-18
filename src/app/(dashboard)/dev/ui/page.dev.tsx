import { BadgeCatalog } from '@/components/features/dev/badge-catalog'
import { BrandCatalog } from '@/components/features/dev/brand-catalog'
import { ButtonCatalog } from '@/components/features/dev/button-catalog'
import { DataCatalog } from '@/components/features/dev/data-catalog'
import { FeedbackCatalog } from '@/components/features/dev/feedback-catalog'
import { FieldCatalog } from '@/components/features/dev/field-catalog'
import { NavigationCatalog } from '@/components/features/dev/navigation-catalog'
import { OverlayCatalog } from '@/components/features/dev/overlay-catalog'
import { DashboardPage } from '@/components/layout/dashboard-page'

export const metadata = { robots: { follow: false, index: false }, title: 'UI kit' }

const UiCatalogPage = () => (
  <DashboardPage fallback={null} title="UI kit" width="wide">
    <div className="flex flex-col gap-10">
      <BrandCatalog />
      <ButtonCatalog />
      <BadgeCatalog />
      <FieldCatalog />
      <NavigationCatalog />
      <FeedbackCatalog />
      <DataCatalog />
      <OverlayCatalog />
    </div>
  </DashboardPage>
)

export default UiCatalogPage
