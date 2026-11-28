'use client'

import { useId } from 'react'

import { useFormatter } from 'next-intl'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { type ChartProps } from '@/components/ui/chart'
import { ChartLegend } from '@/components/ui/chart-legend'
import { CHART_LINES, chartLineColor, chartPaletteIndex } from '@/components/ui/chart-palette'

const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 12 }

const PALETTES = [
  { from: 'var(--chart-teal)', to: 'var(--chart-teal-deep)' },
  { from: 'var(--chart-green-light)', to: 'var(--chart-green)' },
  { from: 'var(--chart-3)', to: 'var(--chart-3)' },
  { from: 'var(--chart-4)', to: 'var(--chart-4)' },
  { from: 'var(--chart-5)', to: 'var(--chart-5)' },
]

export const ChartRenderer = ({ data, series, variant = 'area' }: Pick<ChartProps, 'data' | 'series' | 'variant'>) => {
  const { number } = useFormatter()
  const id = useId()
  const filled = variant === 'area' || variant === 'line'
  const Plot = variant === 'bar' ? BarChart : filled ? AreaChart : LineChart

  return (
    <ResponsiveContainer height="100%" initialDimension={{ height: 256, width: 320 }} minWidth={0} width="100%">
      <Plot accessibilityLayer={false} data={data} margin={{ bottom: 0, left: 0, right: 12, top: 12 }}>
        <defs>
          {series.map((item, index) => {
            const palette = PALETTES[chartPaletteIndex(item.color, index) % PALETTES.length]
            return (
              <linearGradient id={`${id}-${item.key}`} key={item.key} x1="0" x2="0" y1="0" y2="1">
                {filled ? (
                  <>
                    <stop offset="0" style={{ stopColor: palette.from, stopOpacity: 0.4 }} />
                    <stop offset="1" style={{ stopColor: palette.from, stopOpacity: 0.02 }} />
                  </>
                ) : (
                  <>
                    <stop offset="0" style={{ stopColor: palette.from }} />
                    <stop offset="1" style={{ stopColor: palette.to }} />
                  </>
                )}
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          interval="preserveStartEnd"
          minTickGap={12}
          padding={variant === 'bar' ? undefined : { left: 12, right: 12 }}
          tick={AXIS_TICK}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tickFormatter={value => number(Number(value))}
          axisLine={false}
          tick={AXIS_TICK}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value, name) => [typeof value === 'number' ? number(value) : value, name]}
          contentStyle={{
            backgroundColor: 'var(--popover)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--popover-foreground)',
          }}
          cursor={{ fill: 'var(--surface-muted)', opacity: 0.6 }}
        />
        <Legend
          content={
            <ChartLegend
              items={series.map((item, index) => ({ color: chartLineColor(item.color, index), label: item.label }))}
            />
          }
        />
        {series.map((item, index) => {
          const slot = chartPaletteIndex(item.color, index) % PALETTES.length
          if (variant === 'bar') {
            return (
              <Bar
                dataKey={item.key}
                fill={`url(#${id}-${item.key})`}
                isAnimationActive={false}
                key={item.key}
                maxBarSize={18}
                name={item.label}
                radius={[4, 4, 0, 0]}
              />
            )
          }
          if (filled) {
            return (
              <Area
                activeDot={{ r: 4, strokeWidth: 0 }}
                dataKey={item.key}
                dot={false}
                fill={`url(#${id}-${item.key})`}
                isAnimationActive={false}
                key={item.key}
                name={item.label}
                stroke={CHART_LINES[slot]}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                type="monotone"
              />
            )
          }
          return (
            <Line
              dataKey={item.key}
              dot={false}
              isAnimationActive={false}
              key={item.key}
              name={item.label}
              stroke={CHART_LINES[slot]}
              strokeWidth={3}
            />
          )
        })}
      </Plot>
    </ResponsiveContainer>
  )
}
