import { notFound } from 'next/navigation'

import { BadgeCatalog } from '@/components/features/dev/badge-catalog'
import { ButtonCatalog } from '@/components/features/dev/button-catalog'
import { DataCatalog } from '@/components/features/dev/data-catalog'
import { FeedbackCatalog } from '@/components/features/dev/feedback-catalog'
import { FieldCatalog } from '@/components/features/dev/field-catalog'
import { NavigationCatalog } from '@/components/features/dev/navigation-catalog'
import { DashboardPage } from '@/components/layout/dashboard-page'

export const metadata = { robots: { follow: false, index: false }, title: 'UI kit' }

const UiCatalogPage = () => {
  if (process.env.VERCEL_ENV === 'production') notFound()

  return (
    <DashboardPage fallback={null} title="UI kit" width="wide">
      <div className="flex flex-col gap-10">
        <ButtonCatalog />
        <BadgeCatalog />
        <FieldCatalog />
        <NavigationCatalog />
        <FeedbackCatalog />
        <DataCatalog />
      </div>
    </DashboardPage>
  )
}

export default UiCatalogPage
