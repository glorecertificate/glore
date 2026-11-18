'use client'

import { Component } from 'react'

import { useTranslations } from 'next-intl'

import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'

const TabError = ({ onRetry }: { onRetry: () => void }) => {
  const t = useTranslations('Organization')

  return (
    <Banner className="items-center justify-between" role="alert" variant="destructive">
      {t('tabLoadError')}
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        {t('retry')}
      </Button>
    </Banner>
  )
}

interface TabBoundaryProps {
  children: React.ReactNode
  onRetry: () => void
}

export class TabBoundary extends Component<TabBoundaryProps, { failed: boolean }> {
  static getDerivedStateFromError() {
    return { failed: true }
  }

  constructor(props: TabBoundaryProps) {
    super(props)
    this.state = { failed: false }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <TabError onRetry={this.props.onRetry} />
  }
}
