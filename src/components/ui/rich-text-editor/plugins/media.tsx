import { CaptionPlugin } from '@platejs/caption/react'
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react'
import { KEYS } from 'platejs'

import { AudioElement } from '@/components/ui/rich-text-editor/components/media-audio-node'
import { MediaEmbedElement } from '@/components/ui/rich-text-editor/components/media-embed-node'
import { FileElement } from '@/components/ui/rich-text-editor/components/media-file-node'
import { ImageElement } from '@/components/ui/rich-text-editor/components/media-image-node'
import { PlaceholderElement } from '@/components/ui/rich-text-editor/components/media-placeholder-node'
import { MediaPreviewDialog } from '@/components/ui/rich-text-editor/components/media-preview-dialog'
import { MediaUploadToast } from '@/components/ui/rich-text-editor/components/media-upload-toast'
import { VideoElement } from '@/components/ui/rich-text-editor/components/media-video-node'

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
]
