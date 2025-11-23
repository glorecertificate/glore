import { userQuery } from '../users/queries'

export const lessonQuery = `
  id,
  title,
  content,
  sort_order,
  created_at,
  updated_at,
  user_lessons(count),
  questions (
    id,
    description,
    explanation,
    options:question_options (
      id,
      content,
      is_correct,
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
    created_at,
    updated_at,
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
  sort_order,
  created_at,
  updated_at,
  archived_at,
  skill_group:skill_groups (
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
