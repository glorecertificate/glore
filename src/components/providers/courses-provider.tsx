import { listCourses, listSkillGroups } from '@/actions/course'
import { CoursesContextProvider } from '@/components/providers/courses-context'

export const CoursesProvider = async ({ children }: React.PropsWithChildren) => {
  const [{ data: courses, error: coursesError }, { data: skillGroups, error: skillGroupsError }] = await Promise.all([
    listCourses(),
    listSkillGroups(),
  ])
  if (coursesError) throw coursesError
  if (skillGroupsError) throw skillGroupsError

  return <CoursesContextProvider value={{ courses, skillGroups }}>{children}</CoursesContextProvider>
}
