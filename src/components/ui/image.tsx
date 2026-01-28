'use client'

import NextImage from 'next/image'

export const Image = ({
  alt = '',
  height = 0,
  width = 0,
  ...props
}: Omit<React.ComponentProps<typeof NextImage>, 'alt'> & {
  alt?: string
}) => <NextImage alt={alt} height={height} width={width} {...props} />
