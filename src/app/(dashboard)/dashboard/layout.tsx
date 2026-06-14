import { CoursesProvider } from '@/components/features/courses/provider'

const DashboardLayout = ({ children }: React.PropsWithChildren) => <CoursesProvider>{children}</CoursesProvider>

export default DashboardLayout
