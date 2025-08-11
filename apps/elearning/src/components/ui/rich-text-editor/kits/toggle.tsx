'use client'

import { TogglePlugin } from '@platejs/toggle/react'

import { ToggleElement } from '@rte/blocks/toggle-node'
import { IndentKit } from '@rte/kits/indent'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
