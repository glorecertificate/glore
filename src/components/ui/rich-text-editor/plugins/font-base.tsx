import { BaseFontColorPlugin } from '@platejs/basic-styles'
import { KEYS } from 'platejs'

export const BaseFontKit = [BaseFontColorPlugin.configure({ inject: { targetPlugins: [KEYS.p] } })]
