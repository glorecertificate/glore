import { CoursesList } from '@/components/features/courses-list'
import { generateLocalizedMetadata } from '@/lib/metadata'

export default () => <CoursesList />

export const generateMetadata = generateLocalizedMetadata({
  title: 'Navigation.courses',
})
