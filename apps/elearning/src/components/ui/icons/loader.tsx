import { cn } from '@/lib/utils'

export const Loader = ({ className, colored, ...props }: React.SVGProps<SVGSVGElement> & { colored?: boolean }) => (
  <svg
    className={cn('animate-spin stroke-current stroke-2', className)}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path className={cn(colored && 'text-primary')} d="M12 2v4" />
    <path className={cn(colored && 'text-secondary')} d="m16.2 7.8 2.9-2.9" />
    <path className={cn(colored && 'text-tertiary')} d="M18 12h4" />
    <path className={cn(colored && 'text-primary')} d="m16.2 16.2 2.9 2.9" />
    <path className={cn(colored && 'text-secondary')} d="M12 18v4" />
    <path className={cn(colored && 'text-tertiary')} d="m4.9 19.1 2.9-2.9" />
    <path className={cn(colored && 'text-primary')} d="M2 12h4" />
    <path className={cn(colored && 'text-secondary')} d="m4.9 4.9 2.9 2.9" />
  </svg>
)

export const LoaderIcon = Loader
