'use client'

import { useEffect, useState } from 'react'

import { listTranslationStates } from '@/actions/translations/states'
import { type ContentEntityType, type TargetTranslations } from '@/db/queries/content-translation'

export const useContentTranslations = (entityType: ContentEntityType, entityId: number | null, version = 0) => {
  const [items, setItems] = useState<TargetTranslations[] | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (entityId === null) return undefined
    let active = true
    const load = async () => {
      const result = await listTranslationStates({ entityId, entityType })
      if (active && 'data' in result) setItems(result.data)
    }
    void load()
    return () => {
      active = false
    }
  }, [entityId, entityType, reloads, version])

  return { items, refresh: () => setReloads(count => count + 1) }
}

export type ContentTranslations = ReturnType<typeof useContentTranslations>
