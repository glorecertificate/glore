import { parseCourse } from '@/lib/api/courses/parser'
import { createParser } from '@/lib/db'

import { type certificateQuery } from './queries'
import { type Certificate } from './types'

export const parseCertificate = createParser<'certificates', typeof certificateQuery, Certificate>(
  ({ skills, ...certificate }) =>
    ({
      ...certificate,
      skills: skills.map(parseCourse),
    }) as Certificate,
)
