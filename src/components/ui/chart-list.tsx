'use client'

import { useFormatter } from 'next-intl'

import { type ChartProps } from '@/components/ui/chart'
import { ChartLegend } from '@/components/ui/chart-legend'
import { chartLineColor } from '@/components/ui/chart-palette'

export const ChartList = ({ data, series }: Pick<ChartProps, 'data' | 'series'>) => {
  const { number } = useFormatter()
  const max = Math.max(1, ...data.flatMap(row => series.map(item => Number(row[item.key]) || 0)))

  return (
    <div className="flex flex-col" data-slot="chart-list">
      <ol className="flex flex-col gap-4">
        {data.map(row => (
          <li className="flex min-w-0 flex-col gap-1.5" key={row.id}>
            <span className="truncate text-sm font-medium" title={row.label}>
              {row.label}
            </span>
            {series.map((item, index) => {
              const value = Number(row[item.key]) || 0
              return (
                <span className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-3" key={item.key}>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{ backgroundColor: chartLineColor(item.color, index), width: `${(value / max) * 100}%` }}
                    />
                  </span>
                  <span className="text-right text-xs text-fg-2 tabular-nums">{number(value)}</span>
                </span>
              )
            })}
          </li>
        ))}
      </ol>
      <ChartLegend
        className="pt-4"
        items={series.map((item, index) => ({ color: chartLineColor(item.color, index), label: item.label }))}
      />
    </div>
  )
}
