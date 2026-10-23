import { z } from 'zod'

import { LOCALES } from '@/lib/i18n'
import { isHttpUrl } from '@/lib/url'

export const organizationSettingsSchema = (messages: { url: string }) =>
  z.object({
    address: z.string(),
    city: z.string().min(1),
    country: z.string(),
    description: z.record(z.enum(LOCALES), z.string().max(5000)),
    email: z.email(),
    legalName: z.string().max(200),
    legalRepresentative: z.string().max(150),
    name: z.string().min(1),
    phone: z.string(),
    postcode: z.string(),
    region: z.string(),
    registryId: z.string().max(100),
    url: z.string().refine(value => !value.trim() || isHttpUrl(value.trim()), messages.url),
  })
