import { notFound, redirect } from 'next/navigation'

import { createSearchParamsCache, parseAsInteger, parseAsStringEnum } from 'nuqs/server'

import { loadPlayer } from '@/actions/courses/learner'
import { CourseStartPrompt } from '@/components/features/courses/course-overview/start-prompt'
import { CoursePlayer } from '@/components/features/courses/course-player'
import { LessonBody } from '@/components/features/courses/course-player/lesson-body'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LOCALES } from '@/lib/i18n'

const { parse } = createSearchParamsCache({
  lang: parseAsStringEnum(LOCALES),
  lesson: parseAsInteger,
})

const resolvePlayer = async ({ params, searchParams }: PageProps<'/courses/[slug]/learn'>) => {
  const [{ slug }, { lang, lesson }] = await Promise.all([params, parse(searchParams)])
  return { lang, slug, result: await loadPlayer(slug, lesson, lang) }
}

export const generateMetadata = async (props: PageProps<'/courses/[slug]/learn'>) => {
  const { result } = await resolvePlayer(props)
  if (result.status === 'start') return { title: result.overview.title }
  if (result.status !== 'ok') return
  return { title: `${result.lesson.title} | ${result.overview.title}` }
}

const LearnPageContent = async (props: PageProps<'/courses/[slug]/learn'>) => {
  const { lang, result, slug } = await resolvePlayer(props)
  if (result.status === 'not-found') return notFound()
  if (result.status === 'start') return <CourseStartPrompt overview={result.overview} />
  if (result.status === 'overview') return redirect(lang ? `/courses/${slug}?lang=${lang}` : `/courses/${slug}`)
  if (result.status === 'redirect') {
    return redirect(`/courses/${slug}/learn?lang=${result.language}&lesson=${result.lessonId}`)
  }

  const { access, lesson, overview } = result
  return (
    <CoursePlayer
      access={access}
      body={lesson.content ? <LessonBody content={lesson.content} /> : null}
      lesson={lesson}
      overview={overview}
    />
  )
}

const LearnTitle = async (props: PageProps<'/courses/[slug]/learn'>) => {
  const { result } = await resolvePlayer(props)
  return result.status === 'ok' || result.status === 'start' ? result.overview.title : null
}

const LearnPage = (props: PageProps<'/courses/[slug]/learn'>) => (
  <DashboardPage overlap parent="courses" title={<LearnTitle {...props} />} width="wide">
    <LearnPageContent {...props} />
  </DashboardPage>
)

export default LearnPage
