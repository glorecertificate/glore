'use client'

import { useId } from 'react'

import { type Value } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'

import { READER_PLUGINS } from '@/components/features/courses/course-player/reader-plugins'

interface ReaderProviderProps extends React.PropsWithChildren {
  value: Value
  version: string
}

export const ReaderProvider = ({ children, value, version }: ReaderProviderProps) => {
  const id = useId()
  const editor = usePlateEditor({ id, plugins: READER_PLUGINS, readOnly: true, value }, [version])

  return <Plate editor={editor}>{children}</Plate>
}
