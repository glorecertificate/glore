import { parseCourse } from '../courses/utils'
import { parseOrganization } from '../organizations/utils'
import { createParser } from '../utils'
import { type certificateQuery } from './queries'
import { type Certificate } from './types'

export const parseCertificate = createParser<'certificates', typeof certificateQuery, Certificate>(record => {
  const { organization, skills, ...certificate } = record

  return {
    ...certificate,
    organization: parseOrganization(organization),
    skills: skills.map(parseCourse),
  }
})
