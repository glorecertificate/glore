import { ArrowDownRight, ArrowUpRight, Award, Building2, Globe, Users } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const AdminOverview = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight">{'Dashboard Overview'}</h2>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{'Total Users'}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{'1,248'}</div>
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {'12%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{'Organizations'}</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{'86'}</div>
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {'4%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{'Certifications'}</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{'3,782'}</div>
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            <span className="mr-1 flex items-center text-red-500">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              {'2%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{'Active Regions'}</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{'24'}</div>
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {'8%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>{'Recent Activity'}</CardTitle>
          <CardDescription>{'Overview of recent platform activity'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0" key={i}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {i % 3 === 0 ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : i % 3 === 1 ? (
                    <Award className="h-4 w-4 text-primary" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {i % 3 === 0 ? 'New user registered' : i % 3 === 1 ? 'Certificate issued' : 'Organization added'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i % 3 === 0 ? 'John Doe' : i % 3 === 1 ? 'Leadership Certificate' : 'Community Helpers'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {i === 1 ? 'Just now' : i === 2 ? '2 hours ago' : i === 3 ? 'Yesterday' : `${i} days ago`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>{'Pending Approvals'}</CardTitle>
          <CardDescription>{'Items requiring admin attention'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{'Certificate Requests'}</div>
              <div className="text-sm font-bold">{'12'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{'Organization Verifications'}</div>
              <div className="text-sm font-bold">{'5'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{'User Reports'}</div>
              <div className="text-sm font-bold">{'3'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{'Content Flags'}</div>
              <div className="text-sm font-bold">{'7'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
