import { TogglePlugin } from '@platejs/toggle/react'

import { ToggleElement } from '../components/toggle-node'
import { IndentKit } from './indent'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
