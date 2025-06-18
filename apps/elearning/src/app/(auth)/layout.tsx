'use client'

import { Logo } from '@/components/ui/icons/logo'
import { LanguageSelect } from '@/components/ui/language-select'
import { Link } from '@/components/ui/link'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Video } from '@/components/ui/video'
import { Route } from '@/lib/navigation'
import { asset } from '@/lib/storage'

export default ({ children }: React.PropsWithChildren) => (
  <div className="grid min-h-svh lg:grid-cols-12">
    <div className="col-span-5 flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-between gap-2">
        <Link className="flex h-fit items-center gap-1.5" href={Route.Login}>
          <Logo className="w-20" />
        </Link>
        <div className="flex flex-col items-center gap-2">
          <LanguageSelect className="border" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" tooltip={{ arrow: false, side: 'top' }} />
      </div>
    </div>
    <div className="relative col-span-7 hidden bg-muted lg:block">
      <div className="absolute inset-0 z-1 bg-gradient-to-br from-black/40 to-black/20 dark:from-black/20 dark:to-black/10" />
      <Video autoPlay className="absolute inset-0 h-full" controls={false} loop muted src={asset('trailer.mp4')} />
    </div>
  </div>
)
