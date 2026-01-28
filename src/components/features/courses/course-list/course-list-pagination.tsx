'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { useCourseList } from '@/components/features/courses/course-list/course-list-context'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export const CourseListPagination = () => {
  const { currentPage, t, totalPages, setPage } = useCourseList()

  if (totalPages <= 1) return null

  return (
    <Pagination className="justify-end">
      <PaginationContent className="leading-[normal]">
        <PaginationItem>
          <PaginationLink
            aria-label={t('previous')}
            className={cn(
              'flex size-5! h-full transition-none',
              currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
            )}
            onClick={() => setPage(p => Math.max(1, (p || 1) - 1))}
          >
            <ChevronLeftIcon className="size-4" />
          </PaginationLink>
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
          if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
            return (
              <PaginationItem key={p}>
                <PaginationLink
                  active={p === currentPage}
                  className="size-6! cursor-pointer text-xs transition-none"
                  onClick={() => setPage(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          }
          if (p === currentPage - 2 || p === currentPage + 2) {
            return (
              <PaginationItem className="size-6! text-xs" key={p}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }
          return null
        })}
        <PaginationItem>
          <PaginationLink
            aria-label="Next"
            className={cn(
              'flex size-5! items-center transition-none',
              currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
            )}
            onClick={() => setPage(p => Math.min(totalPages, (p || 1) + 1))}
            size="icon"
          >
            <ChevronRightIcon className="size-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
