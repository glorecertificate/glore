import { memo } from 'react'

import { Spinner } from '@/components/ui/rich-text-editor/components/spinner'
import { cn } from '@/lib/utils'

export const ImageOverlay = memo(() => (
  <div
    className={cn(
      'flex flex-row items-center justify-center',
      'absolute inset-0 rounded bg-[var(--mt-overlay)] opacity-100 transition-opacity',
    )}
  >
    <Spinner className="size-7" />
  </div>
))

ImageOverlay.displayName = 'ImageOverlay'
