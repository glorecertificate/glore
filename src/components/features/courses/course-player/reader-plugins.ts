import { type AnyPluginConfig } from 'platejs'

import { AlignKit } from '@/components/ui/rich-text-editor/plugins/align'
import { BasicBlocksKit } from '@/components/ui/rich-text-editor/plugins/basic-blocks'
import { BasicMarksKit } from '@/components/ui/rich-text-editor/plugins/basic-marks'
import { CalloutKit } from '@/components/ui/rich-text-editor/plugins/callout'
import { FontKit } from '@/components/ui/rich-text-editor/plugins/font'
import { LinkKit } from '@/components/ui/rich-text-editor/plugins/link'
import { ListKit } from '@/components/ui/rich-text-editor/plugins/list'
import { MediaKit } from '@/components/ui/rich-text-editor/plugins/media'
import { TableKit } from '@/components/ui/rich-text-editor/plugins/table'
import { ToggleKit } from '@/components/ui/rich-text-editor/plugins/toggle'

export const READER_PLUGINS = [
  AlignKit,
  BasicBlocksKit,
  BasicMarksKit,
  CalloutKit,
  FontKit,
  LinkKit,
  ListKit,
  MediaKit,
  TableKit,
  ToggleKit,
].flat() as AnyPluginConfig[]
