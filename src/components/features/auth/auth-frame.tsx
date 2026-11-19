import { AuthBackLink } from '@/components/features/auth/auth-back-link'
import { AuthBand } from '@/components/features/auth/auth-band'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-2xl', md: 'max-w-xl', sm: 'max-w-md' } as const

export const AuthFrame = ({
  back = true,
  children,
  className,
  language = true,
  size = 'sm',
  ...props
}: React.ComponentProps<'div'> & {
  back?: boolean
  language?: boolean
  size?: keyof typeof WIDTHS
}) => (
  <div className={cn('flex min-h-svh flex-col bg-canvas', className)} data-slot="auth-frame" {...props}>
    <AuthBand language={language} />
    <main className="flex flex-1 justify-center px-page py-6 sm:py-8" data-slot="auth-main">
      <div className={cn('flex w-full flex-col gap-4', WIDTHS[size])}>
        {back && <AuthBackLink />}
        <Card className="gap-6 p-6 sm:p-8">{children}</Card>
      </div>
    </main>
  </div>
)
