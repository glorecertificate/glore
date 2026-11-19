import { Suspense, ViewTransition } from 'react'

import { AuthAside } from '@/components/features/auth/auth-aside'
import { AuthGlobeProvider } from '@/components/features/auth/auth-globe'
import { AuthLanguageSelect } from '@/components/features/auth/auth-language-select'
import { AuthThemeSwitch } from '@/components/features/auth/auth-theme-switch'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-lg', md: 'max-w-md', sm: 'max-w-sm', xl: 'max-w-xl' } as const

export const AuthFrame = ({ children, className, ...props }: React.ComponentProps<'div'>) => (
  <AuthGlobeProvider>
    <div
      className={cn(
        'relative grid min-h-svh grid-rows-[auto_1fr] bg-background lg:grid-cols-[24rem_1fr] lg:grid-rows-1',
        className
      )}
      data-slot="auth-frame"
      {...props}
    >
      <AuthAside />
      <div className="flex min-w-0 flex-col bg-background dark:bg-canvas">
        {children}
        <div className="flex items-center justify-between gap-4 px-page pb-5 lg:px-10 lg:pb-10">
          <Suspense>
            <LegalLinks className="[&_a]:rounded-sm [&_a]:transition-colors [&_a]:outline-none hover:[&_a]:text-link [&_a]:focus-visible:focus-ring motion-reduce:[&_a]:transition-none" />
          </Suspense>
          <Suspense>
            <AuthThemeSwitch />
          </Suspense>
        </div>
      </div>
    </div>
  </AuthGlobeProvider>
)

export const AuthMain = ({
  children,
  header,
  language = true,
  size = 'sm',
}: {
  children: React.ReactNode
  header?: React.ReactNode
  language?: boolean
  size?: keyof typeof WIDTHS
}) => (
  <>
    {language && (
      <div className="absolute top-3.5 right-page z-10 lg:top-10 lg:right-10">
        <AuthLanguageSelect className="max-lg:border-band-border max-lg:bg-band-scrim max-lg:text-band-foreground max-lg:hover:not-disabled:bg-band-scrim/60" />
      </div>
    )}
    <ViewTransition default="none" name="auth-main" share="auth-surface">
      <main className="flex flex-1 items-center justify-center px-page py-8 lg:px-10 lg:py-24" data-slot="auth-main">
        <div className={cn('flex w-full flex-col gap-6', WIDTHS[size])}>
          {header}
          {children}
        </div>
      </main>
    </ViewTransition>
  </>
)
