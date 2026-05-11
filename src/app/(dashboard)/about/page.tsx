import { AboutContent } from '@/components/features/about/content'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'about',
  })

const AboutPage = () => (
  <>
    <PageHeader namespace="Layout" titleKey="about" />
    <PageMain>
      <AboutContent />
    </PageMain>
  </>
)

export default AboutPage
