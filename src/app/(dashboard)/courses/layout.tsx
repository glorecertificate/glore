import { CoursesProvider } from '@/components/features/courses/provider'
import { MessagesScope } from '@/components/providers/messages-scope'

const CoursesLayout = ({ children }: LayoutProps<'/courses'>) => (
  <MessagesScope scope="courses">
    <CoursesProvider>{children}</CoursesProvider>
  </MessagesScope>
)

export default CoursesLayout
