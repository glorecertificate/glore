'use client'

import { useState } from 'react'

import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { FilterRailChips, type FilterRailGroup, FilterRailPanel } from '@/components/ui/filter-rail'
import { SearchInput } from '@/components/ui/search'
import { SectionNav } from '@/components/ui/section-nav'
import { StickySaveBar } from '@/components/ui/sticky-save-bar'

const SECTIONS = [
  { icon: 'user', id: 'profile', label: 'Profile' },
  { icon: 'settings', id: 'account', label: 'Account' },
  { icon: 'bell', id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
] as const

export const LayoutCatalog = () => {
  const [section, setSection] = useState<string>('profile')
  const [dirty, setDirty] = useState(2)
  const [status, setStatus] = useState<string[]>(['approved', 'submitted'])
  const [search, setSearch] = useState('')
  const [age, setAge] = useState<string[]>([])

  const groups: FilterRailGroup[] = [
    {
      id: 'status',
      label: 'Status',
      onChange: setStatus,
      options: [
        { count: 4, label: 'Submitted', tone: 'submitted', value: 'submitted' },
        { count: 7, label: 'Approved', tone: 'approved', value: 'approved' },
        { count: 1, label: 'Rejected', tone: 'rejected', value: 'rejected' },
      ],
      values: status,
    },
    {
      id: 'age',
      label: 'Age',
      onChange: setAge,
      options: [
        { count: 5, label: 'Due', value: 'due' },
        { count: 2, label: 'Overdue', value: 'overdue' },
      ],
      selection: 'single',
      values: age,
    },
  ]

  return (
    <>
      <CatalogSection id="section-nav" name="SectionNav">
        <CatalogRow label="value">
          <SectionNav items={[...SECTIONS]} onValueChange={setSection} value={section} />
        </CatalogRow>
      </CatalogSection>
      <CatalogSection id="sticky-save-bar" name="StickySaveBar">
        <CatalogRow label="count">
          <div className="w-full">
            <StickySaveBar count={dirty} onDiscard={() => setDirty(0)} onSave={() => setDirty(0)} visible />
          </div>
        </CatalogRow>
      </CatalogSection>
      <CatalogSection id="filter-rail" name="FilterRail">
        <CatalogRow label="groups, chips">
          <div className="flex w-full flex-col gap-3">
            <FilterRailPanel
              className="w-full max-w-xs border"
              groups={groups}
              onReset={() => {
                setStatus([])
                setAge([])
                setSearch('')
              }}
              search={() => <SearchInput onValueChange={setSearch} placeholder="Search" size="sm" value={search} />}
            />
            <FilterRailChips groups={groups} />
          </div>
        </CatalogRow>
      </CatalogSection>
    </>
  )
}
