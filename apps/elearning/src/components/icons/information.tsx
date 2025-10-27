import { type IconProps } from '@/components/icons/types'

export const Information = (props: IconProps) => (
  <svg
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

export const InformationIcon = Information
