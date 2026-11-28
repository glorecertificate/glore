export const CHART_LINES = [
  'var(--chart-teal)',
  'var(--chart-green)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export const chartPaletteIndex = (color: string | undefined, index: number) => {
  const match = color?.match(/--chart-(\d)/u)
  return match ? Number(match[1]) - 1 : index
}

export const chartLineColor = (color: string | undefined, index: number) =>
  CHART_LINES[chartPaletteIndex(color, index) % CHART_LINES.length]
