import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const AdminSettingsSection = ({
  children,
  description,
  title,
}: React.PropsWithChildren<{ description: string; title: string }>) => (
  <Card>
    <CardHeader>
      <CardTitle className="type-heading">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
  </Card>
)
