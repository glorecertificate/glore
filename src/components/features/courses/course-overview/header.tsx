import { CourseOverviewActions } from '@/components/features/courses/course-overview/action'
import { CourseOverviewMeta } from '@/components/features/courses/course-overview/meta'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { type CourseAccess, type CourseOverview } from '@/db/queries/learning'

export const CourseOverviewHeader = ({ access, overview }: { access: CourseAccess; overview: CourseOverview }) => (
  <DashboardHeader
    actions={<CourseOverviewActions access={access} overview={overview} />}
    breadcrumb={<CourseOverviewMeta overview={overview} />}
    description={overview.description}
    parent="courses"
    title={overview.title}
  />
)
