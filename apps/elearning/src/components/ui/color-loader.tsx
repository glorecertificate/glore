import { type LucideProps } from 'lucide-react'

export const ColorLoader = ({ size = 32, ...props }: LucideProps) => (
  <svg
    className="lucide lucide-loader animate-spin"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path className="text-primary" d="M12 2v4" />
    <path className="text-secondary" d="m16.2 7.8 2.9-2.9" />
    <path className="text-tertiary" d="M18 12h4" />
    <path className="text-primary" d="m16.2 16.2 2.9 2.9" />
    <path className="text-secondary" d="M12 18v4" />
    <path className="text-tertiary" d="m4.9 19.1 2.9-2.9" />
    <path className="text-primary" d="M2 12h4" />
    <path className="text-secondary" d="m4.9 4.9 2.9 2.9" />
  </svg>
)
