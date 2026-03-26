import { listCourses, listSkillGroups } from '@/actions/course'
import { CoursesContextProvider } from '@/components/providers/courses-context'

export const CoursesProvider = async ({ children }: React.PropsWithChildren) => {
  const [{ data: courses, error: coursesError }, skillGroups] = await Promise.all([listCourses(), listSkillGroups()])
  if (coursesError) throw coursesError
  const ctxValue = { courses, skillGroups }
  return <CoursesContextProvider value={ctxValue}>{children}</CoursesContextProvider>
}
