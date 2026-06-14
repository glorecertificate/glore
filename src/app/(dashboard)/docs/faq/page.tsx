import { getTranslations } from 'next-intl/server'

import { getAuthUser } from '@/actions/auth'
import { findDocCategory, listDocCategories } from '@/actions/doc'
import { DocsSection } from '@/components/features/docs/docs-section'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'docsFaq',
})

const DocsFaqContent = async () => {
  const category = await findDocCategory('faq', { includeUnpublished: true })
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

const DocsFaqPage = async () => {
  const t = await getTranslations('Layout')

  return (
    <DashboardPage title={t('docsFaq')}>
      <DocsFaqContent />
    </DashboardPage>
  )
}

export default DocsFaqPage
