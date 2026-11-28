'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { ChartList } from '@/components/ui/chart-list'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSeries {
  color?: `var(--chart-${1 | 2 | 3 | 4 | 5})`
  key: string
  label: string
}

interface ChartDatum {
  [key: string]: string | number
  id: string | number
  label: string
}

export interface ChartProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  categorical?: boolean
  data: ChartDatum[]
  label: string
  loading?: boolean
  series: ChartSeries[]
  variant?: 'area' | 'bar' | 'line'
}

const LOADING_DELAY_MS = 300

const DelayedSkeleton = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), LOADING_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return visible ? <Skeleton className="size-full" /> : null
}

const loadChartRenderer = async () => {
  const { ChartRenderer: Renderer } = await import('@/components/ui/chart-renderer')
  return Renderer
}

export const preloadChart = async () => {
  await loadChartRenderer()
}

const ChartRenderer = dynamic(loadChartRenderer, { loading: () => <DelayedSkeleton />, ssr: false })

export const Chart = ({
  categorical = false,
  className,
  data,
  label,
  loading = false,
  series,
  variant = 'area',
  ...props
}: ChartProps) => {
  const t = useTranslations('Components.Chart')
  const { number } = useFormatter()

  if (loading) {
    return (
      <div className={cn('min-w-0', className)} data-slot="chart" {...props}>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className={cn('@container/chart min-w-0', className)} data-slot="chart" {...props}>
      {categorical && data.length > 0 && (
        <div aria-hidden className="hidden @max-md/chart:block">
          <ChartList data={data} series={series} />
        </div>
      )}
      <div aria-hidden className={cn('h-64 w-full', categorical && data.length > 0 && '@max-md/chart:hidden')}>
        {data.length > 0 ? (
          <ChartRenderer data={data} series={series} variant={variant} />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </div>
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{t('label')}</th>
              {series.map(item => (
                <th key={item.key} scope="col">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={series.length + 1}>{t('empty')}</td>
              </tr>
            )}
            {data.map(row => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {series.map(item => (
                  <td key={item.key}>
                    {typeof row[item.key] === 'number' ? number(Number(row[item.key])) : row[item.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
