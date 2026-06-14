import { z } from 'zod'

export const organizationSettingsSchema = z.object({
  address: z.string(),
  city: z.string().min(1),
  country: z.string(),
  description: z.string(),
  email: z.email(),
  name: z.string().min(1),
  phone: z.string(),
  postcode: z.string(),
  region: z.string(),
  url: z.string(),
})
