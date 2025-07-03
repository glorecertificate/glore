import { CourseList } from '@/components/features/course-list'
import { generatePageMetadata } from '@/lib/metadata'

export const generateMetadata = generatePageMetadata({
  title: 'Navigation.courses',
})

export default () => <CourseList />
