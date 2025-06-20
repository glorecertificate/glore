'use client'

import { DevWidget } from '@/components/internal/dev-widget'
import { Button } from '@/components/ui/button'
import { SupabaseIcon } from '@/components/ui/icons/supabase'
import { Link } from '@/components/ui/link'
import { externalRoute } from '@/lib/navigation'
import { LocalStorage } from '@/lib/storage'

export const SupabaseWidget = () => (
  <DevWidget storageKey={LocalStorage.SupabaseWidgetPosition}>
    <Button
      asChild
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-background shadow-lg select-none hover:shadow-xl"
    >
      <Link href={externalRoute('SupabaseStudio')} target="_blank">
        <SupabaseIcon />
      </Link>
    </Button>
  </DevWidget>
)
