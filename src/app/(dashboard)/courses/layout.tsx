import { CoursesProvider } from '@/components/features/courses/provider'

const CoursesLayout = ({ children }: LayoutProps<'/courses'>) => <CoursesProvider>{children}</CoursesProvider>

export default CoursesLayout
