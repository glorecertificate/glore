import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { loadPlayer } from '@/actions/courses/learner'
import { CoursePlayer } from '@/components/features/courses/course-player'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { LOCALES } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  lang: parseAsStringEnum(LOCALES),
  lesson: parseAsInteger,
})

const resolvePlayer = async ({ params, searchParams }: PageProps<'/courses/[slug]/learn'>) => {
  const [{ slug }, { lang, lesson }] = await Promise.all([params, parse(searchParams)])
  return { slug, result: await loadPlayer(slug, lesson, lang) }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]/learn'>) => {
  const { result } = await resolvePlayer(props)
  if (result.status !== 'ok') return
  return { title: `${result.lesson.title} | ${result.overview.title}` }
}

const LearnPageContent = async (props: PageProps<'/courses/[slug]/learn'>) => {
  const { result, slug } = await resolvePlayer(props)
  if (result.status === 'not-found') return notFound()
  if (result.status === 'overview') return redirect(`/courses/${slug}`)
  if (result.status === 'redirect') {
    return redirect(`/courses/${slug}/learn?lang=${result.language}&lesson=${result.lessonId}`)
  }

  return (
    <DashboardPage backHref="/courses" title={result.overview.title}>
      <CoursePlayer access={result.access} lesson={result.lesson} overview={result.overview} />
    </DashboardPage>
  )
}

const LearnPage = (props: PageProps<'/courses/[slug]/learn'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <LearnPageContent {...props} />
  </Suspense>
)

export default LearnPage
