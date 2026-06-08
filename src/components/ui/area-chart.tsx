'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'

interface AreaSeries {
  className?: string
  data: number[]
}

export const AreaChart = ({
  className,
  gridLines = 4,
  height = 200,
  series,
  width = 600,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'height' | 'width'> & {
  gridLines?: number
  height?: number
  series: AreaSeries[]
  width?: number
}) => {
  const id = useId().replaceAll(':', '')

  const max = Math.max(...series.flatMap(item => item.data), 1)
  const count = Math.max(...series.map(item => item.data.length), 0)

  if (count < 2) return null

  const stepX = width / (count - 1)

  return (
    <svg
      aria-hidden
      className={cn('w-full', className)}
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      {...props}
    >
      {Array.from({ length: gridLines + 1 }, (_, index) => {
        const y = (height / gridLines) * index
        return (
          <line
            className="stroke-border"
            key={index}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            x1={0}
            x2={width}
            y1={y.toFixed(1)}
            y2={y.toFixed(1)}
          />
        )
      })}
      {series.map((item, seriesIndex) => {
        const points = item.data.map(
          (value, index) => `${(index * stepX).toFixed(1)},${(height - (value / max) * (height - 6) - 3).toFixed(1)}`
        )
        const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point}`).join(' ')
        const area = `${line} L${width},${height} L0,${height} Z`
        const gradientId = `${id}-${seriesIndex}`

        return (
          <g className={item.className} key={seriesIndex}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.2} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
    </svg>
  )
}
