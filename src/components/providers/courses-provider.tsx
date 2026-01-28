import { listCourses, listSkillGroups } from '@/actions/course'
import { CoursesContextProvider } from '@/components/providers/courses-context'

export const CoursesProvider = async ({ children }: React.PropsWithChildren) => {
  const [courses, skillGroups] = await Promise.all([listCourses(), listSkillGroups()])

  return <CoursesContextProvider value={{ courses, skillGroups }}>{children}</CoursesContextProvider>
}
