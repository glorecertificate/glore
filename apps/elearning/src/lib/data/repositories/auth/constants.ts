import { route } from '@/lib/navigation'

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/

export const RESET_PASSWORD_REDIRECT = route('/login')
export const INVITE_USER_REDIRECT = route('/login')
