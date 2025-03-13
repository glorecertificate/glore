'use client'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { LanguageSelect } from '@/components/ui/language-select'
import config from 'static/app.json'

export default ({ children }: React.PropsWithChildren) => (
  <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-between">
        <Link className="flex items-center gap-2 font-medium" href="/">
          <Image src="/logo.svg" width={25} />
          {config.title}
        </Link>
        <LanguageSelect />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">{children}</div>
      </div>
    </div>
    <div className="relative hidden bg-muted lg:block">
      <Image
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        src="/placeholder.svg"
      />
    </div>
  </div>
)
