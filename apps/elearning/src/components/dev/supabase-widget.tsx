import { DevWidget } from '@/components/dev/dev-widget'
import { Button } from '@/components/ui/button'
import { SupabaseIcon } from '@/components/ui/icons/supabase'
import { Link } from '@/components/ui/link'
import { externalRoute } from '@/lib/navigation'
import { getCookie } from '@/lib/server'

export const SupabaseWidget = async () => {
  const position = await getCookie('supabase-widget-position')

  return (
    <DevWidget cookie="supabase-widget-position" defaultPosition={position}>
      <Button
        asChild
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-background shadow-lg select-none hover:shadow-xl"
        variant="transparent"
      >
        <Link href={externalRoute('SupabaseStudio')} target="_blank">
          <SupabaseIcon />
        </Link>
      </Button>
    </DevWidget>
  )
}
