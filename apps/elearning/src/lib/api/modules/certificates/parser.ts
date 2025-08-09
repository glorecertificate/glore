import { type certificateQuery } from '@/lib/api/modules/certificates/queries'
import { type Certificate } from '@/lib/api/modules/certificates/types'
import { parseSkill } from '@/lib/api/modules/courses/parser'
import { createParser } from '@/lib/api/utils'

export const parseCertificate = createParser<'certificates', typeof certificateQuery, Certificate>(
  ({ skills, ...certificate }) =>
    ({
      ...certificate,
      skills: skills.map(parseSkill),
    }) as Certificate,
)
