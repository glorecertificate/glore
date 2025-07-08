'use client'

import { useTranslations } from '@/hooks/use-translations'
import { type MetadataOptions } from '@/lib/metadata'
import metadata from 'config/metadata.json'

type PublicMetadata<T extends boolean> = Pick<MetadataOptions<T>, 'description' | 'separator' | 'title' | 'translate'>

export const useMetadata = <T extends boolean>({
  description: userDescription,
  separator = metadata.titleSeparator,
  title: userTitle,
  translate = true as T,
}: PublicMetadata<T>) => {
  const t = useTranslations()

  if (userTitle) {
    const title = `${translate ? t(userTitle) : userTitle} ${separator} ${metadata.title}`
    document.title = title
  }

  if (userDescription) {
    const description = translate ? t(userDescription) : userDescription
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }
}
