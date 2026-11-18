import { type Route } from 'next'

import { CourseIcon } from '@/components/features/dashboard/course-icon'
import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'

export const CourseRow = ({
  children,
  icon,
  slug,
  title,
  type,
}: React.PropsWithChildren<{
  icon: React.ComponentProps<typeof CourseIcon>['icon']
  slug: string
  title: string
  type: React.ComponentProps<typeof CourseIcon>['type']
}>) => (
  <Link
    className="group/row flex items-center gap-3 rounded-xl border bg-card p-4 shadow-2xs transition-colors outline-none hover:bg-accent/40 focus-visible:focus-ring"
    href={`/courses/${slug}` as Route}
  >
    <CourseIcon icon={icon} type={type} />
    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="truncate text-sm font-medium">{title}</span>
      {children}
    </span>
    <LucideIcon
      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5"
      name="arrow-right"
    />
  </Link>
)
