import { type Value } from 'platejs'
import { type TPlateEditor } from 'platejs/react'

import { type PLUGINS } from '.'

export type Editor = TPlateEditor<Value, (typeof PLUGINS)[number]>
