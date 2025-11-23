import { EMAIL_REGEX, USERNAME_REGEX } from './constants'

export const isValidUsername = (value: string) => EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value)
