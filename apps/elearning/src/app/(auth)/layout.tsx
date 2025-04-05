'use client'

import { Image } from '@/components/ui/image'
import { LanguageSelect } from '@/components/ui/language-select'
import { Link } from '@/components/ui/link'
import { Route } from '@/lib/navigation'
import app from 'config/app.json'

export default ({ children }: React.PropsWithChildren) => (
  <div className="grid min-h-svh lg:grid-cols-5">
    <div className="col-span-2 flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-between gap-2">
        <Link className="flex items-center gap-2 font-medium" href={Route.Home}>
          <Image src="/logo.svg" width={25} />
          {app.title}
        </Link>
        <LanguageSelect />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[22rem]">{children}</div>
      </div>
    </div>
    <div className="relative col-span-3 hidden bg-muted lg:block">
      <Image
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        src="/placeholder.svg"
      />
    </div>
  </div>
)
