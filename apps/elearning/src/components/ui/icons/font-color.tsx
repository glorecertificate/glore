import { type IconProps } from '@/components/ui/icons/types'

export const FontColor = ({ color, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
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
    <path d="M4 20h16" stroke={color}></path>
    <path d="m6 16 6-12 6 12"></path>
    <path d="M8 12h8"></path>
  </svg>
)

export const FontColorIcon = FontColor
