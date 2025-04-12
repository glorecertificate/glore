import { notFound } from 'next/navigation'

import { fetchModule } from '@/api/modules'
import { ModuleFlow } from '@/components/modules/module-flow'
import { appMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'
import { getLocale } from '@/services/i18n'

export default async ({ params }: PageProps<Route.Module>) => {
  const { slug } = (await params) ?? {}
  if (!slug) notFound()

  const pageModule = await fetchModule(slug)
  if (!pageModule) notFound()

  return <ModuleFlow module={pageModule} />
}

export const generateMetadata = async ({ params }: PageProps<Route.Module>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return await appMetadata()

  const pageModule = await fetchModule(slug)
  if (!pageModule) return await appMetadata()

  const locale = await getLocale()

  return appMetadata({
    title: pageModule.title[locale],
    description: pageModule.description?.[locale],
  })
}
