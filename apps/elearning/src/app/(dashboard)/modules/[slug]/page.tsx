import { notFound } from 'next/navigation'

import { metadata } from '@/lib/metadata'
import { type PageProps } from '@/lib/navigation'
import { fetchModule } from '@/services/db'
import { getLocale } from '@/services/i18n'

export default async ({ params }: PageProps<{ slug: string }>) => {
  const { slug } = await params
  if (!slug) notFound()

  const pageModule = await fetchModule(slug)
  if (!pageModule) notFound()

  return pageModule.title.en

  // return <ModuleFlow module={pageModule} />
}

export const generateMetadata = async ({ params }: PageProps<{ slug: string }>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return await metadata()

  const pageModule = await fetchModule(slug)
  if (!pageModule) return await metadata()

  const locale = await getLocale()

  return metadata({
    title: pageModule.title[locale],
    description: pageModule.description?.[locale],
  })
}
