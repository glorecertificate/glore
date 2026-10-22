'use client'

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

const chartComponents = { area: AreaChart, bar: BarChart, line: LineChart }
const seriesComponents = { area: Area, bar: Bar, line: Line }
const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export const ChartRenderer = ({ data, series, variant = 'area' }: Pick<ChartProps, 'data' | 'series' | 'variant'>) => {
  const { number } = useFormatter()
  const Plot = chartComponents[variant]
  const Series = seriesComponents[variant]

  return (
    <ResponsiveContainer height="100%" initialDimension={{ height: 256, width: 320 }} minWidth={0} width="100%">
      <Plot accessibilityLayer={false} data={data} margin={{ bottom: 0, left: 0, right: 12, top: 12 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          minTickGap={24}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={value => number(Number(value))}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value, name) => [typeof value === 'number' ? number(value) : value, name]}
          contentStyle={{
            backgroundColor: 'var(--popover)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--popover-foreground)',
          }}
        />
        <Legend />
        {series.map((item, index) => (
          <Series
            dataKey={item.key}
            fill={item.color ?? colors[index % colors.length]}
            fillOpacity={variant === 'area' ? 0.12 : 1}
            isAnimationActive={false}
            key={item.key}
            name={item.label}
            stroke={item.color ?? colors[index % colors.length]}
            strokeWidth={2}
          />
        ))}
      </Plot>
    </ResponsiveContainer>
  )
}
