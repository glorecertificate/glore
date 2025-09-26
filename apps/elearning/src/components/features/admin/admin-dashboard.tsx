'use client'

import { useCallback, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'

import { AdminCertificates } from '@/components/features/admin/admin-certificates'
import { AdminOrganizations } from '@/components/features/admin/admin-organizations'
import { AdminOverview } from '@/components/features/admin/admin-overview'
import { AdminTeam } from '@/components/features/admin/admin-team'
import { AdminUsers } from '@/components/features/admin/admin-users'

type AdminDashboardTab = 'overview' | 'certificates' | 'users' | 'organizations' | 'team'

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('overview')

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value as AdminDashboardTab)
  }, [])

  return (
    <div className="container flex-1 py-6">
      <Tabs defaultValue="overview" onValueChange={onTabChange} value={activeTab}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">{'Overview'}</TabsTrigger>
            <TabsTrigger value="certificates">{'Certificates'}</TabsTrigger>
            <TabsTrigger value="users">{'Users'}</TabsTrigger>
            <TabsTrigger value="organizations">{'Organizations'}</TabsTrigger>
            <TabsTrigger value="team">{'Team'}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="space-y-4" value="overview">
          <AdminOverview />
        </TabsContent>

        <TabsContent className="space-y-4" value="certificates">
          <AdminCertificates />
        </TabsContent>

        <TabsContent className="space-y-4" value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent className="space-y-4" value="organizations">
          <AdminOrganizations />
        </TabsContent>

        <TabsContent className="space-y-4" value="team">
          <AdminTeam />
        </TabsContent>
      </Tabs>
    </div>
  )
}
