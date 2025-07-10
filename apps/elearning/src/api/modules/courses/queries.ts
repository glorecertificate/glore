import { userQuery } from '@/api/modules/users/queries'

export const skillQuery = `
  id,
  name,
  description,
  iconUrl:icon_url,
  createdAt:created_at,
  updatedAt:updated_at,
  area:skill_areas (
    id,
    name,
    description
  ),
  user_assessments (
    id,
    value
  )
`

export const lessonQuery = `
  id,
  type,
  title,
  content,
  sortOrder:sort_order,
  createdAt:created_at,
  updatedAt:updated_at,
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
  type,
  imageUrl:image_url,
  publishedLocales:published_locales,
  draftLocales:draft_locales,
  sortOrder:sort_order,
  createdAt:created_at,
  updatedAt:updated_at,
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
