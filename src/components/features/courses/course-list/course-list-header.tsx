import { useTranslations } from 'next-intl'

import { CourseListDialog } from '@/components/features/courses/course-list/course-list-dialog'
import { CourseListGroupSelect } from '@/components/features/courses/course-list/course-list-group-select'
import { CourseListLanguageSelect } from '@/components/features/courses/course-list/course-list-language-select'
import { CourseListSort } from '@/components/features/courses/course-list/course-list-sort'
import { CourseListTabsList } from '@/components/features/courses/course-list/course-list-tabs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb'

export const CourseListHeader = () => {
  const t = useTranslations('Courses')

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList className="grow justify-between sm:gap-4">
          <BreadcrumbItem>
            <h1 className="text-base text-foreground">{t('title')}</h1>
          </BreadcrumbItem>
          <BreadcrumbItem className="flex items-center gap-3">
            <CourseListTabsList />
            <CourseListDialog />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <CourseListSort />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 mb-1 flex w-full justify-between">
        <CourseListGroupSelect />
        <CourseListLanguageSelect />
      </div>
    </>
  )
}
