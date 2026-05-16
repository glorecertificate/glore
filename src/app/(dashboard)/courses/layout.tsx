import { CoursesProvider } from '@/components/providers/courses-provider'

const CoursesLayout = ({ children }: LayoutProps<'/courses'>) => <CoursesProvider>{children}</CoursesProvider>

export default CoursesLayout
