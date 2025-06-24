'use client'

import { useState } from 'react'

import { AdminHeader } from '@/components/features/admin-header'
import { AdminStats } from '@/components/features/admin-stats'
import { CertificationsManagement } from '@/components/features/certificates-management'
import { OrganizationsManagement } from '@/components/features/orgs-management'
import { RegionsManagement } from '@/components/features/regions-management'
import { UsersManagement } from '@/components/features/users-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="container flex-1 py-6">
        <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
          <div className="mb-6 flex items-center justify-between">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="overview">{'Overview'}</TabsTrigger>
              <TabsTrigger value="users">{'Users'}</TabsTrigger>
              <TabsTrigger value="organizations">{'Organizations'}</TabsTrigger>
              <TabsTrigger value="certifications">{'Certifications'}</TabsTrigger>
              <TabsTrigger value="regions">{'Regions'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className="space-y-4" value="overview">
            <AdminStats />
          </TabsContent>

          <TabsContent className="space-y-4" value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent className="space-y-4" value="organizations">
            <OrganizationsManagement />
          </TabsContent>

          <TabsContent className="space-y-4" value="certifications">
            <CertificationsManagement />
          </TabsContent>

          <TabsContent className="space-y-4" value="regions">
            <RegionsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
