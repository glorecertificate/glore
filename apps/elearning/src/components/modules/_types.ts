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
