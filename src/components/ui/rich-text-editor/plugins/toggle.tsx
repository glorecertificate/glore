import { TogglePlugin } from '@platejs/toggle/react'

import { ToggleElement } from '@/components/ui/rich-text-editor/components/toggle-node'
import { IndentKit } from '@/components/ui/rich-text-editor/plugins/indent'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
