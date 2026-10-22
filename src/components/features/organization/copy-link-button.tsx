'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

import { useInvitationError } from './use-invitation-error'

interface LinkResult {
  data: { url: string } | null
  error: { code?: string | null } | null
}

interface CopyLinkButtonProps {
  label: string
  load: () => Promise<LinkResult>
}

class LinkLoadError extends Error {
  constructor(readonly code?: string | null) {
    super(code ?? 'generic')
  }
}

export const CopyLinkButton = ({ label, load }: CopyLinkButtonProps) => {
  const t = useTranslations('Components.CopyButton')
  const errorMessage = useInvitationError()
  const [status, setStatus] = useState<'copied' | 'idle' | 'pending'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const resolveUrl = async () => {
    const { data, error } = await load()
    if (data) return data.url
    throw new LinkLoadError(error?.code)
  }

  const toBlob = async () => new Blob([await resolveUrl()], { type: 'text/plain' })

  const copy = async () => {
    if (status === 'pending') return
    setStatus('pending')
    try {
      if (typeof ClipboardItem === 'undefined') await navigator.clipboard.writeText(await resolveUrl())
      else await navigator.clipboard.write([new ClipboardItem({ 'text/plain': toBlob() })])
      setStatus('copied')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      setStatus('idle')
      toast.error(error instanceof LinkLoadError ? errorMessage(error.code) : t('error'))
    }
  }

  return (
    <Button disabled={status === 'pending'} onClick={() => void copy()} size="sm" type="button" variant="outline">
      <LucideIcon name={status === 'copied' ? 'check' : 'copy'} />
      <span aria-live="polite">{status === 'copied' ? t('copied') : label}</span>
    </Button>
  )
}
