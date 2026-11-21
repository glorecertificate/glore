'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { DashboardMenuButton } from '@/components/layout/dashboard-menu-button'
import { useSession } from '@/components/providers/session'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const BAND_SELECTOR = '[data-slot=page-band]'
const NOTICE_SELECTOR = '[data-slot=impersonation-notice]'

const useNoticeOffset = (impersonating: boolean) => {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!impersonating) return
    const notice = document.querySelector<HTMLElement>(NOTICE_SELECTOR)
    if (!notice) return
    const measure = () => setOffset(Math.ceil(notice.getBoundingClientRect().bottom))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(notice)
    return () => {
      observer.disconnect()
      setOffset(0)
    }
  }, [impersonating])

  return impersonating ? offset : 0
}

export const PhoneAppBar = () => {
  const pathname = usePathname()
  const { impersonating } = useSession()
  const { isMobile } = useSidebar()
  const [state, setState] = useState({ title: '', visible: false })
  const offset = useNoticeOffset(Boolean(impersonating))

  useEffect(() => {
    if (!isMobile) return
    let band: Element | null = null

    const intersection = new IntersectionObserver(entries => {
      const entry = entries.findLast(item => item.target.isConnected)
      if (!entry) return
      const title = entry.target.querySelector('h1')?.textContent ?? ''
      setState({ title, visible: !entry.isIntersecting && entry.boundingClientRect.bottom <= 0 })
    })

    const track = () => {
      const current = document.querySelector(BAND_SELECTOR)
      if (current === band) return
      if (band) intersection.unobserve(band)
      band = current
      if (!current) {
        setState({ title: '', visible: false })
        return
      }
      intersection.observe(current)
    }

    track()
    const mutation = new MutationObserver(track)
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutation.disconnect()
      intersection.disconnect()
      setState({ title: '', visible: false })
    }
  }, [isMobile, pathname])

  if (!isMobile) return null

  return (
    <div
      aria-hidden={!state.visible}
      className={cn(
        'fixed inset-x-0 top-0 z-6 flex items-center gap-2 border-b border-header-border bg-header pt-safe px-page-safe text-header-foreground transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden',
        state.visible ? 'translate-y-0' : '-translate-y-full'
      )}
      data-slot="phone-app-bar"
      inert={!state.visible}
      style={{ top: offset }}
    >
      <DashboardMenuButton className="ml-0" />
      <span className="min-w-0 flex-1 truncate py-3 text-base font-medium">{state.title}</span>
    </div>
  )
}
