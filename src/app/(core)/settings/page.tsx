import { UserSettings } from '@/components/features/users/user-settings'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'settings',
  })

export default () => (
  <>
    <PageHeader />
    <PageMain>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{'Settings'}</h1>
          <p className="text-muted-foreground">{'Manage your profile information and preferences'}</p>
        </div>
        <div className="rounded-lg bg-card p-6">
          <UserSettings />
        </div>
      </div>
    </PageMain>
  </>
)
