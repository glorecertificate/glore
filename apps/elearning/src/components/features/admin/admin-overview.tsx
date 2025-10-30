import { ArrowDownRightIcon, ArrowUpRightIcon, AwardIcon, Building2Icon, GlobeIcon, UsersIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const AdminOverview = () => (
  <div className="space-y-6">
    <h2 className="font-bold text-3xl tracking-tight">{'Dashboard Overview'}</h2>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{'Total users'}</CardTitle>
          <UsersIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{'1,248'}</div>
          <p className="mt-1 flex items-center text-muted-foreground text-xs">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRightIcon className="mr-1 size-3" />
              {'12%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{'Organizations'}</CardTitle>
          <Building2Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{'86'}</div>
          <p className="mt-1 flex items-center text-muted-foreground text-xs">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRightIcon className="mr-1 size-3" />
              {'4%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{'Certifications'}</CardTitle>
          <AwardIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{'3,782'}</div>
          <p className="mt-1 flex items-center text-muted-foreground text-xs">
            <span className="mr-1 flex items-center text-red-500">
              <ArrowDownRightIcon className="mr-1 size-3" />
              {'2%'}
            </span>
            {'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{'Active Regions'}</CardTitle>
          <GlobeIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{'24'}</div>
          <p className="mt-1 flex items-center text-muted-foreground text-xs">
            <span className="mr-1 flex items-center text-green-500">
              <ArrowUpRightIcon className="mr-1 size-3" />
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
                <div className="flex size-8 items-center justify-center rounded-full bg-brand-secondary/10">
                  {i % 3 === 0 ? (
                    <UsersIcon className="size-4 text-brand-secondary" />
                  ) : i % 3 === 1 ? (
                    <AwardIcon className="size-4 text-brand-secondary" />
                  ) : (
                    <Building2Icon className="size-4 text-brand-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {i % 3 === 0 ? 'New user registered' : i % 3 === 1 ? 'Certificate issued' : 'Organization added'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {i % 3 === 0 ? 'John Doe' : i % 3 === 1 ? 'Leadership Certificate' : 'Community Helpers'}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs">
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
              <div className="font-medium text-sm">{'Certificate Requests'}</div>
              <div className="font-bold text-sm">{'12'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{'Organization Verifications'}</div>
              <div className="font-bold text-sm">{'5'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{'User Reports'}</div>
              <div className="font-bold text-sm">{'3'}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{'Content Flags'}</div>
              <div className="font-bold text-sm">{'7'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
