import { OnboardingErrorContent } from '@/components/features/onboarding/error-content'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Join',
  title: 'errorTitle',
})

const OnboardingErrorPage = () => <OnboardingErrorContent />

export default OnboardingErrorPage
