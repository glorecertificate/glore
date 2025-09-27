import { type Value } from 'platejs'
import { type TPlateEditor } from 'platejs/react'

import { type PLUGINS } from './config'

export type RichTextEditor = TPlateEditor<Value, (typeof PLUGINS)[number]>
