import { z } from 'zod'

import { PASSWORD_REGEX } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'

type ErrorKey =
  | 'birthPlaceRequired'
  | 'birthdayRequired'
  | 'firstNameRequired'
  | 'lastNameRequired'
  | 'nationalityRequired'
  | 'passwordMismatch'
  | 'passwordRequirements'

export const STEP_FIELDS = [
  ['firstName', 'lastName'],
  ['birthday', 'nationality', 'birthPlace'],
  ['phone', 'preferredLanguage'],
  ['password', 'confirmPassword'],
] as const

export const STEP_NAMES = ['name', 'about', 'contact', 'password'] as const

export const createOnboardingSchema = (t: (key: ErrorKey) => string) =>
  z
    .object({
      birthPlace: z
        .string()
        .trim()
        .min(1, { message: t('birthPlaceRequired') }),
      birthday: z.string().min(1, { message: t('birthdayRequired') }),
      confirmPassword: z.string(),
      firstName: z
        .string()
        .trim()
        .min(1, { message: t('firstNameRequired') }),
      lastName: z
        .string()
        .trim()
        .min(1, { message: t('lastNameRequired') }),
      nationality: z.string().min(1, { message: t('nationalityRequired') }),
      password: z.string().regex(PASSWORD_REGEX, { message: t('passwordRequirements') }),
      phone: z.string(),
      preferredLanguage: z.enum(LOCALES),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    })

export type OnboardingFormValues = z.infer<ReturnType<typeof createOnboardingSchema>>
