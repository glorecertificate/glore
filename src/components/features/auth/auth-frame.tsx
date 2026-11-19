import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

const WIDTHS = { lg: 'max-w-2xl', md: 'max-w-xl', sm: 'max-w-md' } as const

export const AuthFrame = ({
  children,
  className,
  language = false,
  logo = true,
  size = 'sm',
  ...props
}: React.ComponentProps<'div'> & {
  language?: boolean
  logo?: boolean
  size?: keyof typeof WIDTHS
}) => (
  <div
    className={cn('flex min-h-screen items-center justify-center bg-background p-6', className)}
    data-slot="auth-frame"
    {...props}
  >
    <div className={cn('mx-auto flex w-full flex-col gap-10', WIDTHS[size])}>
      {(logo || language) && (
        <div className="flex flex-col items-center gap-6">
          {logo && <Logo className="w-40" />}
          {language && <LanguageSelect className="min-w-28 border" />}
        </div>
      )}
      {children}
    </div>
  </div>
)
