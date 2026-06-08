import { cn } from '@/lib/utils'

export const RadialProgress = ({
  children,
  className,
  size = 132,
  strokeWidth = 10,
  value,
  ...props
}: React.ComponentProps<'div'> & {
  size?: number
  strokeWidth?: number
  value: number
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ height: size, width: size }}
      {...props}
    >
      <svg className="-rotate-90" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle
          className="text-brand/15"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className="text-brand transition-[stroke-dashoffset] duration-700 ease-out"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  )
}
