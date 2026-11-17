import { OnboardingErrorContent } from '@/components/features/onboarding/error-content'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Join',
  title: 'errorTitle',
})

const OnboardingErrorPage = () => (
  <MessagesScope scope="onboardingError">
    <OnboardingErrorContent />
  </MessagesScope>
)

export default OnboardingErrorPage
