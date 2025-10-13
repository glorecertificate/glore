import { UserSettings } from '@/components/features/users/user-settings'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = intlMetadata({
  title: 'settings',
})

export default () => (
  <main className="flex h-[calc(100vh-4rem)] flex-col">
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">{'Settings'}</h1>
        <p className="text-muted-foreground">{'Manage your profile information and preferences'}</p>
      </div>

      <div className="rounded-lg bg-card p-6">
        <UserSettings />
      </div>
    </div>
  </main>
)
