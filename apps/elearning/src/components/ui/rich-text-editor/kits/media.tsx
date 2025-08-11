'use client'

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

import { AudioElement } from '@rte/blocks/media-audio-node'
import { MediaEmbedElement } from '@rte/blocks/media-embed-node'
import { FileElement } from '@rte/blocks/media-file-node'
import { ImageElement } from '@rte/blocks/media-image-node'
import { PlaceholderElement } from '@rte/blocks/media-placeholder-node'
import { MediaPreviewDialog } from '@rte/blocks/media-preview-dialog'
import { MediaUploadToast } from '@rte/blocks/media-upload-toast'
import { VideoElement } from '@rte/blocks/media-video-node'

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
