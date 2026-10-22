'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Image } from '@/components/ui/image'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const QrCode = ({
  className,
  label,
  size = 128,
  value,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  label: string
  size?: number
  value: string
}) => {
  const t = useTranslations('Components.QrCode')
  const [result, setResult] = useState<{ value: string; url?: string; error?: boolean } | null>(null)

  useEffect(() => {
    let active = true
    const generate = async () => {
      try {
        const { toDataURL } = await import('qrcode')
        const url = await toDataURL(value, { errorCorrectionLevel: 'M', margin: 4, width: size * 2 })
        if (active) setResult({ url, value })
      } catch {
        if (active) setResult({ error: true, value })
      }
    }
    void generate()
    return () => {
      active = false
    }
  }, [size, value])

  const current = result?.value === value ? result : null

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)} data-slot="qr-code" {...props}>
      {current?.url ? (
        <Image alt={label} className="rounded-md" height={size} src={current.url} unoptimized width={size} />
      ) : current?.error ? (
        <p role="status">{t('error')}</p>
      ) : (
        <Skeleton
          aria-label={t('loading')}
          className="rounded-md"
          role="status"
          style={{ height: size, width: size }}
        />
      )}
    </div>
  )
}
