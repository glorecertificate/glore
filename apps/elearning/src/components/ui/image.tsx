'use client'

import NextImage from 'next/image'
import { useMemo } from 'react'

import { type ImageLoader } from 'next/dist/client/image-component'
import { type OnLoadingComplete, type PlaceholderValue, type StaticImport } from 'next/dist/shared/lib/get-img-props'

export interface ImageProps
  extends Omit<
    React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
    'alt' | 'height' | 'loading' | 'ref' | 'src' | 'srcSet' | 'width'
  > {
  alt?: string
  blurDataURL?: string
  fill?: boolean
  height?: number | `${number}`
  layout?: string
  lazyBoundary?: string
  lazyRoot?: string
  loader?: ImageLoader
  loading?: 'eager' | 'lazy' | undefined
  objectPosition?: string
  onLoadingComplete?: OnLoadingComplete
  overrideSrc?: string
  placeholder?: PlaceholderValue
  priority?: boolean
  quality?: number | `${number}`
  src: string | StaticImport
  unoptimized?: boolean
  width?: number | `${number}`
}

export const Image = (props: ImageProps) => {
  const { alt = '', fill, height, sizes = '100vw', style, width, ...rest } = props

  const styles = useMemo(() => {
    if (fill) return style

    return {
      width: width ? `${width}px` : 'fit-content',
      height: height ? `${height}px` : 'fit-content',
      ...style,
    }
  }, [fill, height, style, width])

  return <NextImage alt={alt} fill={fill} height={0} sizes={sizes} style={styles} width={0} {...rest} />
}
