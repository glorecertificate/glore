import { notFound, redirect } from 'next/navigation'

import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server'

import { loadCompletion } from '@/actions/courses/learner'
import { CourseCompleteView } from '@/components/features/courses/course-complete'
import { DashboardPage } from '@/components/layout/dashboard-page'
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

const CompleteTitle = async (props: PageProps<'/courses/[slug]/complete'>) => {
  const { result } = await resolveCompletion(props)
  return result.status === 'ok' ? result.overview.title : null
}

const CompletePageContent = async (props: PageProps<'/courses/[slug]/complete'>) => {
  const { result, slug } = await resolveCompletion(props)
  if (result.status === 'not-found') return notFound()
  if (result.status === 'overview') return redirect(`/courses/${slug}`)

  return <CourseCompleteView completion={result.completion} overview={result.overview} />
}

const CompletePage = (props: PageProps<'/courses/[slug]/complete'>) => (
  <DashboardPage parent="courses" title={<CompleteTitle {...props} />} width="prose">
    <CompletePageContent {...props} />
  </DashboardPage>
)

export default CompletePage
