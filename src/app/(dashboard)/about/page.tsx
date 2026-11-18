import { AboutContent } from '@/components/features/about'
import { AboutTagline } from '@/components/features/about/tagline'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'about',
})

const AboutPage = () => (
  <DashboardPage overlap description={<AboutTagline />} title={<PageTitle namespace="Layout" name="about" />}>
    <AboutContent />
  </DashboardPage>
)

export default AboutPage
