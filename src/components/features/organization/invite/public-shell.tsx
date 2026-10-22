import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

export const PublicShell = ({ children, className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex min-h-screen items-center justify-center p-6', className)} {...props}>
    <div className="mx-auto flex w-full max-w-md flex-col gap-10">
      <div className="flex flex-col items-center gap-6">
        <Logo className="w-40" />
        <LanguageSelect className="min-w-28 border" />
      </div>
      {children}
    </div>
  </div>
)
