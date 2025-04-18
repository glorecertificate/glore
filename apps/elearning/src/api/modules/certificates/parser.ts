import { type certificateQuery } from '@/api/modules/certificates/queries'
import { type Certificate } from '@/api/modules/certificates/types'
import { parseSkill } from '@/api/modules/courses/parser'
import { createParser } from '@/api/utils'

export const parseCertificate = createParser<'certificates', typeof certificateQuery, Certificate>(
  ({ skills, ...certificate }) => ({
    ...certificate,
    skills: skills.map(parseSkill),
  }),
)
