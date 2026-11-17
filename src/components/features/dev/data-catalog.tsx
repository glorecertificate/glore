'use client'

import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { FilterBar } from '@/components/ui/filter-bar'
import { Input } from '@/components/ui/input'
import { LevelDots } from '@/components/ui/level-dots'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Timeline } from '@/components/ui/timeline'
import { TimelineItem } from '@/components/ui/timeline-item'

interface CatalogMember {
  email: string
  id: string
  name: string
  role: string
}

const MEMBERS: CatalogMember[] = [
  { email: 'ada@glore.test', id: 'ada', name: 'Ada Lovelace', role: 'owner' },
  { email: 'grace@glore.test', id: 'grace', name: 'Grace Hopper', role: 'tutor' },
  { email: 'alan@glore.test', id: 'alan', name: 'Alan Turing', role: 'learner' },
]

const COLUMNS: DataTableColumn<CatalogMember>[] = [
  { cell: member => member.name, header: 'name', id: 'name', sortValue: member => member.name },
  { cell: member => member.email, header: 'email', id: 'email' },
  {
    cell: member => <StatusBadge tone={member.role === 'owner' ? 'info' : 'neutral'}>{member.role}</StatusBadge>,
    header: 'role',
    id: 'role',
    sortValue: member => member.role,
  },
]

const LEVELS = [1, 2, 3, 4, 5] as const

const LAYOUTS = ['stacked', 'rows', 'inline'] as const satisfies NonNullable<
  React.ComponentProps<typeof DescriptionList>['layout']
>[]

const AVATARS = MEMBERS.map(({ id, name }) => ({ id, placeholder: name }))

const getMemberId = (member: CatalogMember) => member.id

const clearFilters = () => undefined

export const DataCatalog = () => (
  <>
    <CatalogSection id="card" name="Card, StatCard">
      <CatalogRow label="Card">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{'CardTitle'}</CardTitle>
            <CardDescription>{'CardDescription'}</CardDescription>
          </CardHeader>
          <CardContent>{'CardContent'}</CardContent>
        </Card>
      </CatalogRow>
      <CatalogRow label="StatCard">
        <StatCard className="w-56" description="description" label="label" value={1280} />
        <StatCard className="w-56" description="description" label="loading" loading value={0} />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="description-list" name="DescriptionList">
      {LAYOUTS.map(layout => (
        <CatalogRow key={layout} label={`layout=${layout}`}>
          <DescriptionList className="w-full" layout={layout}>
            {MEMBERS.slice(0, 2).map(member => (
              <DescriptionItem key={member.id}>
                <DescriptionTerm>{member.name}</DescriptionTerm>
                <DescriptionDetails>{member.email}</DescriptionDetails>
              </DescriptionItem>
            ))}
          </DescriptionList>
        </CatalogRow>
      ))}
    </CatalogSection>
    <CatalogSection id="data-table" name="DataTable, FilterBar">
      <CatalogRow label="rows">
        <DataTable
          className="w-full"
          columns={COLUMNS}
          emptyDescription="emptyDescription"
          emptyTitle="emptyTitle"
          filters={
            <FilterBar active onClear={clearFilters}>
              <Input aria-label="search" className="w-48" defaultValue="ada" icon="search" size="sm" />
            </FilterBar>
          }
          getRowId={getMemberId}
          label="rows"
          rows={MEMBERS}
        />
      </CatalogRow>
      <CatalogRow label="loading">
        <DataTable
          className="w-full"
          columns={COLUMNS}
          emptyDescription="emptyDescription"
          emptyTitle="emptyTitle"
          getRowId={getMemberId}
          label="loading"
          loading
          rows={[]}
        />
      </CatalogRow>
      <CatalogRow label="empty">
        <DataTable
          className="w-full"
          columns={COLUMNS}
          emptyDescription="emptyDescription"
          emptyTitle="emptyTitle"
          getRowId={getMemberId}
          label="empty"
          rows={[]}
        />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="level-dots" name="LevelDots, Timeline, AvatarStack">
      <CatalogRow label="LevelDots">
        <div className="flex flex-col gap-2">
          {LEVELS.map(level => (
            <LevelDots key={level} label={`level ${level}`} level={level} steps={LEVELS.length} />
          ))}
        </div>
      </CatalogRow>
      <CatalogRow label="Timeline">
        <Timeline>
          <TimelineItem dateTime="2026-10-22T16:55:00Z" description="description" time="Oct 22, 4:55 PM">
            {'TimelineItem'}
          </TimelineItem>
          <TimelineItem dateTime="2026-10-23T09:10:00Z" time="Oct 23, 9:10 AM">
            {'TimelineItem'}
          </TimelineItem>
        </Timeline>
      </CatalogRow>
      <CatalogRow label="AvatarStack">
        <AvatarStack avatars={AVATARS} />
      </CatalogRow>
    </CatalogSection>
  </>
)
