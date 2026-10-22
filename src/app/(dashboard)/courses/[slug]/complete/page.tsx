import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server'

import { loadCompletion } from '@/actions/courses/learner'
import { CourseCompleteView } from '@/components/features/courses/course-complete'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { LOCALES } from '@/lib/i18n'

const { parse } = createSearchParamsCache({ lang: parseAsStringEnum(LOCALES) })

const resolveCompletion = async ({ params, searchParams }: PageProps<'/courses/[slug]/complete'>) => {
  const [{ slug }, { lang }] = await Promise.all([params, parse(searchParams)])
  return { result: await loadCompletion(slug, lang), slug }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]/complete'>) => {
  const { result } = await resolveCompletion(props)
  if (result.status !== 'ok') return
  return { title: result.overview.title }
}

const CompletePageContent = async (props: PageProps<'/courses/[slug]/complete'>) => {
  const { result, slug } = await resolveCompletion(props)
  if (result.status === 'not-found') return notFound()
  if (result.status === 'overview') return redirect(`/courses/${slug}`)

  return (
    <DashboardPage backHref="/courses" title={result.overview.title}>
      <CourseCompleteView completion={result.completion} overview={result.overview} />
    </DashboardPage>
  )
}

const CompletePage = (props: PageProps<'/courses/[slug]/complete'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <CompletePageContent {...props} />
  </Suspense>
)

export default CompletePage
