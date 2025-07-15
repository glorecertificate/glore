import { cookies } from 'next/headers'

import { LocalWidget } from '@/components/dev/local-widget'
import { Button } from '@/components/ui/button'
import { SupabaseIcon } from '@/components/ui/icons/supabase'
import { Link } from '@/components/ui/link'
import { externalRoute } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'

export const SupabaseWidget = async () => {
  const { get } = await cookies()
  const positionCookie = get(Cookie.SupabaseWidgetPosition)?.value
  const position = positionCookie
    ? (JSON.parse(positionCookie) as {
        x: number
        y: number
      })
    : undefined

  return (
    <LocalWidget cookie={Cookie.SupabaseWidgetPosition} defaultPosition={position}>
      <Button
        asChild
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-background shadow-lg select-none hover:shadow-xl"
        variant="transparent"
      >
        <Link href={externalRoute('SupabaseStudio')} target="_blank">
          <SupabaseIcon />
        </Link>
      </Button>
    </LocalWidget>
  )
}
