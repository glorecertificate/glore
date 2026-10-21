import { listSessionCourses } from '@/actions/courses/helpers'
import { listSkillGroups } from '@/actions/courses/queries'
import { CoursesContextProvider } from '@/components/features/courses/context'

export const CoursesProvider = async ({ children }: React.PropsWithChildren) => {
  const [{ data: courses, error: coursesError }, skillGroups] = await Promise.all([
    listSessionCourses(),
    listSkillGroups(),
  ])
  if (coursesError) throw coursesError
  const ctxValue = { courses, skillGroups }
  return <CoursesContextProvider value={ctxValue}>{children}</CoursesContextProvider>
}
