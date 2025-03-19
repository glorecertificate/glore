import { notFound } from 'next/navigation'

import ModuleFlow from '@/components/modules/module-flow'
import { getModuleById } from '@/lib/data'
import { metadata } from '@/lib/metadata'
import { type PageProps } from '@/lib/types'

interface ModulePageProps extends PageProps<{ id: string }> {}

export default async ({ params }: ModulePageProps) => {
  const { id } = (await params) ?? {}
  if (!id) notFound()
  const pageModule = getModuleById(id)
  if (!pageModule) notFound()

  return <ModuleFlow module={pageModule} />
}

export const generateMetadata = async ({ params }: ModulePageProps) => {
  const { id } = (await params) ?? {}
  if (!id) return await metadata()
  const pageModule = getModuleById(id)
  if (!pageModule) return await metadata()

  return metadata({
    title: pageModule.title,
    description: pageModule.description,
  })
}
