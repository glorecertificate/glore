import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsIntro',
})

const DocsIntroContent = async () => {
  const category = await findDocCategory('intro', { includeUnpublished: true })
  if (!category) return null
  const [user, categories] = await Promise.all([getAuthUser(), listDocCategories({ includeUnpublished: true })])

  return (
    <DocsSection
      allCategories={categories.data ?? []}
      canEdit={user?.role === 'admin' || Boolean(user?.isEditor)}
      category={category}
    />
  )
}

const DocsIntroPage = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage title={t('docsIntro')}>
      <DocsIntroContent />
    </DashboardPage>
  )
}

export default DocsIntroPage
