import { CoursesProvider } from '@/components/providers/courses-provider'

const DashboardLayout = ({ children }: React.PropsWithChildren) => <CoursesProvider>{children}</CoursesProvider>

export default DashboardLayout
