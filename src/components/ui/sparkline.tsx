'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'

export const Sparkline = ({
  className,
  data,
  height = 36,
  width = 96,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'height' | 'width'> & {
  data: number[]
  height?: number
  width?: number
}) => {
  const id = useId().replaceAll(':', '')

  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((value, index) => {
    const x = index * stepX
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      aria-hidden
      className={cn('overflow-visible text-brand', className)}
      fill="none"
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      {...props}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  )
}
