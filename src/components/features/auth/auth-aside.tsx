import { AuthAsideCopy } from '@/components/features/auth/auth-aside-copy'
import { AuthGlobe } from '@/components/features/auth/auth-globe'
import { AuthLogo } from '@/components/features/auth/auth-logo'

export const AuthAside = () => (
  <aside
    className="relative flex flex-col overflow-hidden bg-sidebar px-page pt-3 pb-4 text-sidebar-foreground band-scope lg:sticky lg:top-0 lg:h-svh lg:bg-auth-aside lg:p-10"
    data-slot="auth-aside"
  >
    <div className="absolute auth-globe max-lg:hidden">
      <AuthGlobe className="size-full" />
    </div>
    <div className="pointer-events-none relative flex flex-col">
      <div className="flex min-h-10 items-center">
        <AuthLogo />
      </div>
      <AuthAsideCopy />
    </div>
  </aside>
)
