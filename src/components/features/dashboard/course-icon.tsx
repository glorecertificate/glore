'use client'

import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { type EnumType } from '@/db/types'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CourseIcon = ({
  className,
  icon,
  type,
}: {
  className?: string
  icon: string | null
  type: EnumType<'course_type'>
}) => (
  <span
    aria-hidden
    className={cn(
      'flex size-9 shrink-0 items-center justify-center rounded-lg',
      courseIconVariants({ background: true, type }),
      className
    )}
  >
    <LucideIcon className="size-4" name={(icon ?? 'book-open') as IconName} />
  </span>
)
