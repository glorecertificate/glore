import { type AnyObject } from '@repo/utils'

export interface PageProps<T extends AnyObject = AnyObject, K extends AnyObject = AnyObject> {
  params?: Promise<T>
  searchParams?: Promise<K>
}

export type SegmentParams<T extends object> = T extends AnyObject
  ? { [K in keyof T]: T[K] extends string ? string | string[] | undefined : never }
  : T

export interface Module {
  description: string
  id: string
  image: string
  steps: Step[]
  title: string
}

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed'

export interface ModuleProgress {
  completedLessons: number
  dateAdded?: string
  description: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: number
  id: string
  image: string
  progress: number
  status: ModuleStatus
  title: string
  totalLessons: number
}

export type Step = DescriptiveStep | TrueFalseStep | EvaluationStep

export type StepType = 'descriptive' | 'true-false' | 'evaluation'

export interface BaseStep {
  content: string
  id: string
  title: string
  type: StepType
}

export interface DescriptiveStep extends BaseStep {
  images?: string[]
  type: 'descriptive'
}

export interface TrueFalseStep extends BaseStep {
  correctAnswer: boolean
  question: string
  type: 'true-false'
}

export interface EvaluationQuestion {
  id: string
  question: string
}

export interface EvaluationStep extends BaseStep {
  questions: EvaluationQuestion[]
  type: 'evaluation'
}

export type CertificateStatus = 'issued' | 'pending' | 'rejected'

export interface Certificate {
  expiryDate?: string
  id: string
  image: string
  issueDate?: string
  organization: string
  requestDate: string
  status: CertificateStatus
  title: string
}
