import { createContext, use } from 'react'

import { parseAsStringEnum } from 'nuqs'

import { type InsightsScope } from './insights-cache'

export const ORGANIZATION_TAB_PARAM = 'tab'
const ORGANIZATION_TABS = [
  'overview',
  'members',
  'invitations',
  'requests',
  'certificates',
  'insights',
  'activity',
  'settings',
] as const

export type OrganizationTab = (typeof ORGANIZATION_TABS)[number]
export const DEFAULT_ORGANIZATION_TAB = 'overview'

export const organizationTabParser = parseAsStringEnum([...ORGANIZATION_TABS]).withDefault(DEFAULT_ORGANIZATION_TAB)

export interface OrganizationTabState {
  pending: boolean
  scope: InsightsScope
  setTab: (tab: OrganizationTab) => void
  shown: OrganizationTab
  tab: OrganizationTab
}

export const OrganizationTabContext = createContext<OrganizationTabState | null>(null)

export const useOrganizationTab = () => {
  const state = use(OrganizationTabContext)
  if (!state) throw new Error('useOrganizationTab must be used inside OrganizationTabs')
  return state
}
