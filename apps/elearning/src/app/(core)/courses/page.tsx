import { CourseList } from '@/components/features/course-list'
import { generateLocalizedMetadata } from '@/lib/metadata'

export default () => <CourseList />

export const generateMetadata = generateLocalizedMetadata({
  title: 'Navigation.courses',
})
