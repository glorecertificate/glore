import { userQuery } from '@/lib/api/users/queries'
import { TIMESTAMPS } from '@/lib/db'

export const lessonQuery = `
  id,
  title,
  content,
  sortOrder:sort_order,
  ${TIMESTAMPS},
  user_lessons(count),
  questions (
    id,
    description,
    explanation,
    options:question_options (
      id,
      content,
      isCorrect:is_correct,
      user_answers(count)
    )
  ),
  assessment:assessments (
    id,
    description,
    user_assessments (
      id,
      value
    )
  ),
  evaluations (
    id,
    description,
    user_evaluations (
      id,
      value
    )
  ),
  contributions (
    id,
    ${TIMESTAMPS},
    user:users (
      ${userQuery}
    )
  )
`

export const courseQuery = `
  id,
  type,
  slug,
  title,
  description,
  icon,
  languages,
  sortOrder:sort_order,
  ${TIMESTAMPS},
  archivedAt:archived_at,
  skillGroup:skill_groups (
    id,
    name
  ),
  creator:users (
    ${userQuery}
  ),
  lessons (
    ${lessonQuery}
  ),
  user_courses(count)
`
