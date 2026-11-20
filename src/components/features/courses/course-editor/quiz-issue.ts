export const QUIZ_ISSUE_EVENT = 'course-editor:quiz-issue'

export interface QuizIssue {
  optionId?: number
  questionId: number
  target: 'correct' | 'option' | 'options' | 'question'
}

let current: QuizIssue | null = null

export const getQuizIssue = () => current

export const clearQuizIssue = () => {
  current = null
}

export const raiseQuizIssue = (issue: QuizIssue) => {
  current = issue
  window.dispatchEvent(new Event(QUIZ_ISSUE_EVENT))
}
