import { Suspense, ViewTransition } from 'react'

import { AuthGlobeProvider } from '@/components/features/auth/auth-globe'
import { AuthLanguageSelect } from '@/components/features/auth/auth-language-select'
import { AuthLogo } from '@/components/features/auth/auth-logo'
import { AuthThemeSwitch } from '@/components/features/auth/auth-theme-switch'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-lg', md: 'max-w-md', sm: 'max-w-sm', xl: 'max-w-xl' } as const

const COLUMNS = {
  compact: 'lg:grid-cols-[20rem_1fr] xl:grid-cols-[24rem_1fr]',
  hero: 'lg:grid-cols-2',
} as const

export const AuthFrame = ({
  children,
  className,
  language = true,
  panel,
  size = 'sm',
  variant = 'compact',
  ...props
}: React.ComponentProps<'div'> & {
  language?: boolean
  panel?: React.ReactNode
  size?: keyof typeof WIDTHS
  variant?: keyof typeof COLUMNS
}) => (
  <AuthGlobeProvider>
    <div
      className={cn('grid min-h-svh grid-rows-[auto_1fr] bg-background lg:grid-rows-1', COLUMNS[variant], className)}
      data-slot="auth-frame"
      {...props}
    >
      <ViewTransition default="none" name="auth-panel" share="auth-surface">
        <aside
          className="flex flex-col bg-sidebar px-page pt-3 pb-4 text-sidebar-foreground band-scope lg:sticky lg:top-0 lg:h-svh lg:justify-between lg:p-10"
          data-slot="auth-panel"
        >
          <div className="flex min-h-10 items-center justify-between gap-4">
            <ViewTransition default="none" name="auth-logo" share="auth-fixed">
              <AuthLogo />
            </ViewTransition>
            {language && (
              <div className="lg:hidden">
                <AuthLanguageSelect className="border-band-border bg-band-scrim text-band-foreground hover:not-disabled:bg-band-scrim/60" />
              </div>
            )}
          </div>
          {panel && <div className="flex flex-col items-center justify-center lg:flex-1 lg:py-8">{panel}</div>}
          <Suspense>
            <ViewTransition default="none" name="auth-legal" share="auth-fixed">
              <LegalLinks className="justify-center text-sidebar-muted max-lg:hidden [&_a]:rounded-sm [&_a]:transition-colors [&_a]:outline-none hover:[&_a]:text-band-foreground [&_a]:focus-visible:focus-ring motion-reduce:[&_a]:transition-none" />
            </ViewTransition>
          </Suspense>
        </aside>
      </ViewTransition>
      <ViewTransition default="none" name="auth-pane" share="auth-surface">
        <div className="flex min-w-0 flex-col bg-background dark:bg-canvas">
          <div className="flex items-end justify-end px-10 pt-10 max-lg:hidden">
            {language && (
              <ViewTransition default="none" name="auth-language" share="auth-fixed">
                <div className="flex">
                  <AuthLanguageSelect />
                </div>
              </ViewTransition>
            )}
          </div>
          <main className="flex flex-1 items-center justify-center px-page py-8 lg:px-10 lg:py-6" data-slot="auth-main">
            <div className={cn('w-full', WIDTHS[size])}>{children}</div>
          </main>
          <div className="flex items-center justify-between gap-4 px-page pb-5 lg:justify-end lg:px-10 lg:pb-10">
            <Suspense>
              <LegalLinks className="lg:hidden [&_a]:rounded-sm [&_a]:transition-colors [&_a]:outline-none hover:[&_a]:text-link [&_a]:focus-visible:focus-ring motion-reduce:[&_a]:transition-none" />
            </Suspense>
            <Suspense>
              <ViewTransition default="none" name="auth-theme" share="auth-fixed">
                <AuthThemeSwitch />
              </ViewTransition>
            </Suspense>
          </div>
        </div>
      </ViewTransition>
    </div>
  </AuthGlobeProvider>
)
