import { TogglePlugin } from '@platejs/toggle/react'

import { IndentKit } from '@/components/blocks/rich-text-editor/plugins/indent'
import { ToggleElement } from '@/components/blocks/rich-text-editor/ui/toggle-node'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
