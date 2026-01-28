import { getCookie } from '@/actions/cookies'
import { listCourses, listSkillGroups } from '@/actions/course'
import {
  CourseListContextProvider,
  type CourseListContextValue,
} from '@/components/features/courses/course-list/course-list-context'

export const CourseListProvider = async ({
  children,
  value,
}: React.ProviderProps<CourseListContextValue['params']>) => {
  const [courses, skillGroups, courseLanguages] = await Promise.all([
    listCourses(),
    listSkillGroups(),
    getCookie('courseLanguages'),
  ])

  return (
    <CourseListContextProvider value={{ courseLanguages, courses, skillGroups, params: value }}>
      {children}
    </CourseListContextProvider>
  )
}
