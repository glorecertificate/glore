'use client'

import { BaseSuggestionPlugin, type BaseSuggestionConfig } from '@platejs/suggestion'
import { isSlateEditor, isSlateElement, isSlateString, type ExtendConfig, type Path } from 'platejs'
import { toTPlatePlugin, type RenderNodeWrapper } from 'platejs/react'

import { type Any } from '@repo/utils/types'

import { BlockSuggestion } from '#rte/blocks/block-suggestion'
import { SuggestionLeaf, SuggestionLineBreak } from '#rte/blocks/suggestion-node'
import { discussionPlugin } from '#rte/kits/discussion'

export type SuggestionConfig = ExtendConfig<
  BaseSuggestionConfig,
  {
    activeId: string | null
    hoverId: string | null
    uniquePathMap: Map<string, Path>
  }
>

export const suggestionPlugin = toTPlatePlugin<SuggestionConfig>(BaseSuggestionPlugin, ({ editor }) => ({
  options: {
    activeId: null,
    currentUserId: editor.getOption(discussionPlugin, 'currentUserId'),
    hoverId: null,
    uniquePathMap: new Map(),
  },
})).configure({
  handlers: {
    // unset active suggestion when clicking outside of suggestion
    onClick: ({ api, event, setOption, type }) => {
      let leaf = event.target as HTMLElement
      let isSet = false

      const unsetActiveSuggestion = () => {
        setOption('activeId', null)
        isSet = true
      }

      if (!isSlateString(leaf)) unsetActiveSuggestion()

      while (leaf.parentElement && !isSlateElement(leaf.parentElement) && !isSlateEditor(leaf.parentElement)) {
        if (leaf.classList.contains(`slate-${type}`)) {
          const suggestionEntry = api.suggestion.node({ isText: true })

          if (!suggestionEntry) {
            unsetActiveSuggestion()

            break
          }

          const id = api.suggestion.nodeId(suggestionEntry[0])

          setOption('activeId', id ?? null)
          isSet = true

          break
        }

        leaf = leaf.parentElement
      }

      if (!isSet) unsetActiveSuggestion()
    },
  },
  render: {
    belowNodes: SuggestionLineBreak as RenderNodeWrapper<Any>,
    node: SuggestionLeaf,
    belowRootNodes: ({ api, element }) => {
      if (!api.suggestion.isBlockSuggestion(element)) {
        return null
      }

      return <BlockSuggestion element={element} />
    },
  },
})

export const SuggestionKit = [suggestionPlugin]
