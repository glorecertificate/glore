import { Suspense } from 'react'

import { cookies } from '@/actions/cookies'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { CoursesProvider } from '@/components/providers/courses-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const fallback = <LoadingFallback size="full" />

export default async ({ children }: LayoutProps<'/'>) => {
  const { get } = await cookies()
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <Suspense fallback={fallback}>
      <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
        <SessionProvider>
          <CoursesProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </CoursesProvider>
        </SessionProvider>
      </SidebarProvider>
    </Suspense>
  )
}
