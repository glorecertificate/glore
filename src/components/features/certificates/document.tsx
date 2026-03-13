import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { type CertificateFormValues } from '@/components/features/certificates/schemas'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff',
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  header: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 48,
    paddingVertical: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#99f6e4',
    fontSize: 9,
    fontWeight: 400,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  orgLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 48,
  },
  certifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  certifyLine: {
    height: 1,
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  certifyText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 400,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  volunteeerName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  orgName: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 1.7,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 28,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  col: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: 400,
  },
  skillsSection: {
    marginBottom: 24,
  },
  skillsTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#f0fdf4',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  skillChipText: {
    fontSize: 9,
    color: '#166534',
    fontWeight: 600,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 48,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f766e',
  },
  ratingDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
})

export interface CertificateDocumentProps {
  values: Partial<CertificateFormValues>
  volunteerName: string
  orgName: string
  orgLogoUrl?: string | null
  skillNames: string[]
  issuedDate?: string
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const CertificateDocument = ({
  values,
  volunteerName,
  orgName,
  orgLogoUrl,
  skillNames,
  issuedDate,
}: CertificateDocumentProps) => (
  <Document title={`GloRe Certificate — ${volunteerName}`} author="GloRe" subject="Volunteering Certificate">
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GloRe Certificate</Text>
          <Text style={styles.headerSubtitle}>Global Volunteering Network</Text>
        </View>
        {orgLogoUrl ? <Image src={orgLogoUrl} style={styles.orgLogo} /> : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.certifyRow}>
          <View style={styles.certifyLine} />
          <Text style={styles.certifyText}>This is to certify that</Text>
          <View style={styles.certifyLine} />
        </View>

        <Text style={styles.volunteeerName}>{volunteerName || 'Your Name'}</Text>
        <Text style={styles.orgName}>{orgName || 'Your Organization'}</Text>

        <Text style={styles.descriptionText}>
          {values.activityDescription ||
            'Your volunteering activity description will appear here once you fill in the form.'}
        </Text>

        <View style={styles.divider} />

        {/* Activity details */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Activity period</Text>
            <Text style={styles.metaValue}>
              {values.activityStartDate && values.activityEndDate
                ? `${formatDate(values.activityStartDate)} – ${formatDate(values.activityEndDate)}`
                : '—'}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValue}>{values.activityDuration ? `${values.activityDuration} hours` : '—'}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{values.activityLocation || '—'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.metaLabel}>Organization rating</Text>
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={i < (values.organizationRating ?? 0) ? styles.ratingDot : styles.ratingDotEmpty} />
              ))}
            </View>
          </View>
        </View>

        {/* Skills */}
        {skillNames.length > 0 ? (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Certified Skills</Text>
            <View style={styles.skillsGrid}>
              {skillNames.map((name, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>GloRe — Global Volunteering Network</Text>
        <Text style={styles.footerText}>
          {issuedDate
            ? `Issued on ${formatDate(issuedDate)}`
            : `Issued on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`}
        </Text>
      </View>
    </Page>
  </Document>
)
