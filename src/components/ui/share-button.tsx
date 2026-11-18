'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export const ShareButton = ({
  children,
  copiedLabel,
  failedLabel,
  title,
  url,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick'> & {
  copiedLabel: string
  failedLabel: string
  title: string
  url: string
}) => {
  const share = async () => {
    const href = new URL(url, window.location.origin).toString()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: href })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(href)
      toast.success(copiedLabel)
    } catch {
      toast.error(failedLabel)
    }
  }

  return (
    <Button onClick={share} type="button" {...props}>
      {children}
    </Button>
  )
}
