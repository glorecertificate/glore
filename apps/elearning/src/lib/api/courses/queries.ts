import { userQuery } from '@/lib/api/users/queries'
import { timestamps } from '@/lib/api/utils'

export const skillQuery = `
  id,
  name,
  description,
  ${timestamps},
  group:skill_groups (
    id,
    name,
    icon
  ),
  user_assessments (
    id,
    value
  )
`

export const lessonQuery = `
  id,
  title,
  content,
  sortOrder:sort_order,
  ${timestamps},
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
  )
`

export const courseQuery = `
  id,
  slug,
  title,
  description,
  imageUrl:image_url,
  publishedLocales:published_locales,
  draftLocales:draft_locales,
  sortOrder:sort_order,
  ${timestamps},
  archivedAt:archived_at,
  user_courses(count),
  skill:skills (
    ${skillQuery}
  ),
  lessons (
    ${lessonQuery}
  ),
  creator:users (
    ${userQuery}
  )
`
