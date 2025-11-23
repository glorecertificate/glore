import { route } from '@/lib/navigation'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
export const RESET_PASSWORD_REDIRECT = route('/login')
