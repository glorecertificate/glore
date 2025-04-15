import { notFound } from 'next/navigation'

import { createUserModule, getModule, ModuleStatus } from '@/api/modules'
import { getCurrentUserId } from '@/api/users'
import { ModuleFlow } from '@/components/modules/module-flow'
import { appMetadata } from '@/lib/metadata'
import { type PageProps, type Route } from '@/lib/navigation'
import { getLocale } from '@/services/i18n'

export default async ({ params }: PageProps<Route.Module>) => {
  const { slug } = (await params) ?? {}
  if (!slug) notFound()

  const module = await getModule({ slug })
  if (!module) notFound()

  if (module.status === ModuleStatus.NotStarted) {
    const userId = await getCurrentUserId()
    await createUserModule({ userId, moduleId: module.id })
    module.status = ModuleStatus.InProgress
  }

  return <ModuleFlow moduleId={module.id} />
}

export const generateMetadata = async ({ params }: PageProps<Route.Module>) => {
  const { slug } = (await params) ?? {}
  if (!slug) return await appMetadata()

  const pageModule = await getModule({ slug })
  if (!pageModule) return await appMetadata()

  const locale = await getLocale()

  return appMetadata({
    title: pageModule.title[locale],
    description: pageModule.description?.[locale],
  })
}
