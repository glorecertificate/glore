'use client'

import dynamic from 'next/dynamic'

import { useFormatter, useTranslations } from 'next-intl'

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
  data: ChartDatum[]
  label: string
  series: ChartSeries[]
  variant?: 'area' | 'bar' | 'line'
}

const ChartRenderer = dynamic(
  async () => {
    const { ChartRenderer: Renderer } = await import('@/components/ui/chart-renderer')
    return Renderer
  },
  { loading: () => <Skeleton className="size-full" />, ssr: false }
)

export const Chart = ({ className, data, label, series, variant = 'area', ...props }: ChartProps) => {
  const t = useTranslations('Components.Chart')
  const { number } = useFormatter()

  return (
    <div className={cn('min-w-0', className)} data-slot="chart" {...props}>
      <div aria-hidden className="h-64 w-full">
        {data.length > 0 ? (
          <ChartRenderer data={data} series={series} variant={variant} />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </div>
      <table className="sr-only">
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
  )
}
