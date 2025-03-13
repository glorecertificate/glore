import { cookies } from 'next/headers'

import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Cookie } from '@/lib/storage'
import { getDB } from '@/services/db'

export default async ({ children }: React.PropsWithChildren) => {
  const { auth } = await getDB()
  const { data } = await auth.getUser()
  const { get } = await cookies()
  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar user={data.user} />
      <SidebarInset>
        <AppHeader />
        <main>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">{children}</div>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
              <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
