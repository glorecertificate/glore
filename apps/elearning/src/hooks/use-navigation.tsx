'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { type getTranslations } from 'next-intl/server'

import { sections, type Pathname } from '@/lib/navigation'
import { type MessageKey } from '@/services/i18n'

export const parseSections = (pathname: Pathname, t: Awaited<ReturnType<typeof getTranslations>>) =>
  sections.map(({ pages, ...section }) => ({
    ...section,
    pages: pages.map(page => {
      const isActive = pathname === page.path
      const isActiveSection = page.path.split('/').at(1) === pathname.split('/').at(1)

      /* eslint-disable @typescript-eslint/no-explicit-any */
      return {
        ...page,
        title: t(page.title as any),
        isActive,
        isActiveSection,
        subPages:
          page.subPages?.map(subPage => {
            const isActive =
              pathname === subPage.path || (subPage.path.includes(':') && new RegExp(`${page.path}/\\w+`).test(subPage.path))
            const title = subPage.title ? t(subPage.title as any) : (document.title.match(/^([\w\s]+) \W/)?.at(1) as MessageKey)
            return { ...subPage, title, isActive }
          }) ?? [],
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }
    }),
  }))

/**
 * Hook returning information about the navigation status.
 */
export const useNavigation = () => {
  const pathname = usePathname() as Pathname
  const t = useTranslations()
  const sections = useMemo(() => parseSections(pathname, t), [pathname, t])

  return { pathname, sections }
}
