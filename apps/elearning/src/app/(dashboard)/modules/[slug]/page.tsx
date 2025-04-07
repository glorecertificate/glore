import { notFound } from 'next/navigation'

import api from '@/api'
import { ModuleFlow } from '@/components/modules/module-flow'
import { appMetadata } from '@/lib/metadata'
import { type PageProps } from '@/lib/navigation'
import { getLocale } from '@/services/i18n'

export default async ({ params }: PageProps<{ slug: string }>) => {
  const { slug } = (await params) ?? {}
  if (!slug) notFound()

  const pageModule = await api.modules.fetchOne(slug)
  if (!pageModule) notFound()

  return <ModuleFlow module={pageModule} />
}

export const generateMetadata = async ({ params }: PageProps<{ slug: string }>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return await appMetadata()

  const pageModule = await api.modules.fetchOne(slug)
  if (!pageModule) return await appMetadata()

  const locale = await getLocale()

  return appMetadata({
    title: pageModule.title[locale],
    description: pageModule.description?.[locale],
  })
}
