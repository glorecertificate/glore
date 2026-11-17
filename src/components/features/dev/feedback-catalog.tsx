import { CatalogRow } from '@/components/features/dev/catalog-row'
import { CatalogSection } from '@/components/features/dev/catalog-section'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

const BANNERS = ['info', 'success', 'warning', 'destructive'] as const satisfies NonNullable<
  React.ComponentProps<typeof Banner>['variant']
>[]

const SPINNER_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const satisfies NonNullable<
  React.ComponentProps<typeof Spinner>['size']
>[]

const PROGRESS = [0, 40, 100] as const

export const FeedbackCatalog = () => (
  <>
    <CatalogSection id="banner" name="Banner">
      {BANNERS.map(variant => (
        <CatalogRow key={variant} label={variant}>
          <Banner className="w-full" variant={variant}>
            {variant}
          </Banner>
        </CatalogRow>
      ))}
    </CatalogSection>
    <CatalogSection id="spinner" name="Spinner, LoadingFallback">
      <CatalogRow label="size">
        {SPINNER_SIZES.map(size => (
          <Spinner aria-label={size} key={size} size={size} />
        ))}
      </CatalogRow>
      <CatalogRow label="variant=colored">
        <Spinner aria-label="colored" size="lg" variant="colored" />
      </CatalogRow>
      <CatalogRow label="LoadingFallback">
        <LoadingFallback className="h-24 w-full rounded-md border border-dashed" />
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="skeleton" name="Skeleton, Progress">
      <CatalogRow label="Skeleton">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="size-9 rounded-full" />
      </CatalogRow>
      <CatalogRow label="SkeletonText">
        <p className="text-sm">
          <SkeletonText>{'placeholder text'}</SkeletonText>
        </p>
      </CatalogRow>
      <CatalogRow label="Progress">
        {PROGRESS.map(value => (
          <Progress aria-label={`${value}`} className="w-40" key={value} value={value} />
        ))}
      </CatalogRow>
    </CatalogSection>
    <CatalogSection id="empty" name="Empty">
      <CatalogRow label="default">
        <Empty className="w-full border">
          <EmptyHeader>
            <EmptyTitle>{'EmptyTitle'}</EmptyTitle>
            <EmptyDescription>{'EmptyDescription'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CatalogRow>
      <CatalogRow label="EmptyMedia variant=icon">
        <Empty className="w-full border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="inbox" />
            </EmptyMedia>
            <EmptyTitle>{'EmptyTitle'}</EmptyTitle>
            <EmptyDescription>{'EmptyDescription'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CatalogRow>
    </CatalogSection>
  </>
)
