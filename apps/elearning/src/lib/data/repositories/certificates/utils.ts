import { type CourseRecord, parseCourse } from '../courses/utils'
import { createParser } from '../utils'
import { type Certificate } from './types'

export interface CertificateRecord {
  skills: CourseRecord[]
  [key: string]: unknown
}

export const parseCertificate = createParser<CertificateRecord, Certificate>(record => {
  const { skills, ...certificate } = record

  return {
    ...certificate,
    skills: skills.map(parseCourse),
  } as Certificate
})
