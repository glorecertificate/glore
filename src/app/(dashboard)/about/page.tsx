import { AboutContent } from '@/components/features/about'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'about',
})

const AboutPage = () => (
  <DashboardPage title={<PageTitle namespace="Layout" name="about" />}>
    <AboutContent />
  </DashboardPage>
)

export default AboutPage
