'use client'

import { useMemo } from 'react'

import { useTheme } from 'next-themes'

import { Image, type ImageProps } from '@/components/ui/image'
import { Asset } from '@/lib/storage'
import { Theme } from '@/lib/theme'

export const Logo = ({
  alt,
  full,
  ...props
}: Omit<ImageProps, 'src'> & {
  full?: boolean
}) => {
  const { systemTheme, theme } = useTheme()

  const imageAlt = useMemo(() => alt || 'Logo', [alt])
  const isDarkImage = useMemo(
    () => (theme === Theme.System ? systemTheme === Theme.Light : theme === Theme.Light),
    [systemTheme, theme],
  )
  const src = useMemo(() => (full ? (isDarkImage ? Asset.GloreDark : Asset.Glore) : Asset.Logo), [full, isDarkImage])

  return <Image alt={imageAlt} src={src} suppressHydrationWarning {...props} />
}
