import { type LucideProps } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CustomIconProps extends LucideProps {}

export type CustomIcon = (props: CustomIconProps) => React.JSX.Element

export const DashboardIcon: CustomIcon = ({ className, ...props }) => (
  <svg
    className={cn('lucide lucide-layout-dashboard stroke-current stroke-2', className)}
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect className="stroke-primary" fill="transparent" height="9" rx="1" width="7" x="3" y="3" />
    <rect className="stroke-tertiary" fill="transparent" height="5" rx="1" width="7" x="14" y="3" />
    <rect className="stroke-secondary" fill="transparent" height="9" rx="1" width="7" x="14" y="12" />
    <rect className="stroke-foreground" fill="transparent" height="5" rx="1" width="7" x="3" y="16" />
  </svg>
)
