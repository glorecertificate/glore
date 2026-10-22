'use client'

import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { rateCourse } from '@/actions/courses/progress'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RatingGroup } from '@/components/ui/rating-group'
import { Textarea } from '@/components/ui/textarea'
import { COMMENT_MAX_LENGTH } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

export const CourseRatingForm = ({
  className,
  courseId,
  initial,
  ...props
}: React.ComponentProps<'form'> & {
  courseId: number
  initial: { comment: string | null; rating: number } | null
}) => {
  const t = useTranslations('Learning.complete')
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [saved, setSaved] = useState(!!initial)
  const [saving, setSaving] = useState(false)

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating === null) return
    setSaving(true)
    startTransition(async () => {
      const result = await rateCourse({ comment, courseId, rating })
      setSaving(false)
      if ('error' in result) {
        toast.error(t('saveError'))
        return
      }
      setSaved(true)
      toast.success(t('saved'))
    })
  }

  return (
    <form className={cn('flex flex-col gap-5', className)} onSubmit={onSubmit} {...props}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t('rateTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('rateHint')}</p>
      </div>
      <RatingGroup
        className="max-w-sm"
        color="brand"
        id={`course-rating-${courseId}`}
        onValueChange={value => {
          setRating(Number(value))
          setSaved(false)
        }}
        value={rating ?? undefined}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`course-comment-${courseId}`}>{t('commentLabel')}</Label>
        <Textarea
          aria-describedby={`course-comment-${courseId}-count`}
          id={`course-comment-${courseId}`}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={event => {
            setComment(event.target.value)
            setSaved(false)
          }}
          placeholder={t('commentPlaceholder')}
          value={comment}
        />
        <p className="text-xs text-muted-foreground" id={`course-comment-${courseId}-count`}>
          {t('commentCount', { count: comment.length, max: COMMENT_MAX_LENGTH })}
        </p>
      </div>
      <Button className="self-start" disabled={rating === null || saved} loading={saving} type="submit">
        {initial ? t('update') : t('submit')}
      </Button>
    </form>
  )
}
