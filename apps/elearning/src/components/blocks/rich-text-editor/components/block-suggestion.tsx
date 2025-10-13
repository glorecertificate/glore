'use client'

import { Fragment, useMemo, useState } from 'react'

import {
  type TResolvedSuggestion,
  acceptSuggestion,
  getSuggestionKey,
  keyId2SuggestionId,
  rejectSuggestion,
} from '@platejs/suggestion'
import { SuggestionPlugin } from '@platejs/suggestion/react'
import { CheckIcon, XIcon } from 'lucide-react'
import {
  ElementApi,
  KEYS,
  type NodeEntry,
  type Path,
  PathApi,
  type TElement,
  type TSuggestionElement,
  type TSuggestionText,
  TextApi,
} from 'platejs'
import { useEditorPlugin, usePluginOption } from 'platejs/react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '../hooks/use-i18n'
import { type TDiscussion, discussionPlugin } from '../plugins/discussion'
import { suggestionPlugin } from '../plugins/suggestion'
import { Comment, CommentCreateForm, type TComment, useCommentDate } from './comment'

export interface ResolvedSuggestion extends TResolvedSuggestion {
  comments: TComment[]
}

const BLOCK_SUGGESTION = '__block__'

export const BlockSuggestion = ({ element }: { element: TSuggestionElement }) => {
  const suggestionData = element.suggestion

  const isRemove = useMemo(() => suggestionData?.type === 'remove', [suggestionData])

  if (suggestionData?.isLineBreak) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-1 border-2 border-brand/[0.8] transition-opacity',
        isRemove && 'border-gray-300'
      )}
      contentEditable={false}
    />
  )
}

export const BlockSuggestionCard = ({
  idx,
  isLast,
  suggestion,
}: {
  idx: number
  isLast: boolean
  suggestion: ResolvedSuggestion
}) => {
  const { api, editor } = useEditorPlugin(SuggestionPlugin)
  const userInfo = usePluginOption(discussionPlugin, 'user', suggestion.userId)
  const { t } = useI18n()
  const formattedDate = useCommentDate(new Date(suggestion.createdAt))

  const accept = (suggestion: ResolvedSuggestion) => {
    api.suggestion.withoutSuggestions(() => {
      acceptSuggestion(editor, suggestion)
    })
  }

  const reject = (suggestion: ResolvedSuggestion) => {
    api.suggestion.withoutSuggestions(() => {
      rejectSuggestion(editor, suggestion)
    })
  }

  const [hovering, setHovering] = useState(false)

  const suggestionText2Array = (text: string) => {
    if (text === BLOCK_SUGGESTION) return ['line breaks']
    return text.split(BLOCK_SUGGESTION).filter(Boolean)
  }

  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div
      className="relative"
      key={`${suggestion.suggestionId}-${idx}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex flex-col p-4">
        <div className="relative flex items-center">
          <Avatar className="size-5">
            <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
            <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
          </Avatar>
          <h4 className="mx-2 font-semibold text-sm leading-none">{userInfo?.name}</h4>
          <div className="text-muted-foreground/80 text-xs leading-none">
            <span className="mr-1">{formattedDate}</span>
          </div>
        </div>
        <div className="relative mt-1 mb-4 pl-[32px]">
          <div className="flex flex-col gap-2">
            {suggestion.type === 'remove' &&
              suggestionText2Array(suggestion.text!).map((text, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <span className="text-muted-foreground text-sm">{t.suggestions.delete}</span>

                  <span className="text-sm" key={index}>
                    {text}
                  </span>
                </div>
              ))}
            {suggestion.type === 'insert' &&
              suggestionText2Array(suggestion.newText!).map((text, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <span className="text-muted-foreground text-sm">{t.suggestions.add}</span>
                  <span className="text-sm" key={index}>
                    {text || 'line breaks'}
                  </span>
                </div>
              ))}
            {suggestion.type === 'replace' && (
              <div className="flex flex-col gap-2">
                {suggestionText2Array(suggestion.newText!).map((text, index) => (
                  <Fragment key={index}>
                    <div className="flex items-start gap-2 text-brand/80" key={index}>
                      <span className="text-sm">{t.suggestions.with}</span>
                      <span className="text-sm">{text || 'line breaks'}</span>
                    </div>
                  </Fragment>
                ))}
                {suggestionText2Array(suggestion.text!).map((text, index) => (
                  <Fragment key={index}>
                    <div className="flex items-start gap-2" key={index}>
                      <span className="text-muted-foreground text-sm">
                        {index === 0 ? t.suggestions.replace : t.suggestions.delete}
                      </span>
                      <span className="text-sm">{text || 'line breaks'}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}
            {suggestion.type === 'update' && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {Object.keys(suggestion.properties as Record<string, string>).map(key => (
                    <span key={key}>
                      {'Un'}
                      {key}
                    </span>
                  ))}
                  {Object.keys(suggestion.newProperties as Record<string, string>).map(key => (
                    <span key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  ))}
                </span>
                <span className="text-sm">{suggestion.newText}</span>
              </div>
            )}
          </div>
        </div>
        {suggestion.comments.map((comment, index) => (
          <Comment
            comment={comment}
            discussionLength={suggestion.comments.length}
            documentContent="__suggestion__"
            editingId={editingId}
            index={index}
            key={comment.id ?? index}
            setEditingId={setEditingId}
          />
        ))}
        {hovering && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button className="size-6 p-1 text-muted-foreground" onClick={() => accept(suggestion)} variant="ghost">
              <CheckIcon className="size-4" />
            </Button>
            <Button className="size-6 p-1 text-muted-foreground" onClick={() => reject(suggestion)} variant="ghost">
              <XIcon className="size-4" />
            </Button>
          </div>
        )}
        <CommentCreateForm discussionId={suggestion.suggestionId} />
      </div>
      {!isLast && <div className="h-px w-full bg-muted" />}
    </div>
  )
}

export const useResolveSuggestion = (
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[],
  blockPath: Path
): ResolvedSuggestion[] => {
  const discussions = usePluginOption(discussionPlugin, 'discussions')
  const { api, editor, getOption, setOption } = useEditorPlugin(suggestionPlugin)
  const { t } = useI18n()

  const typeTextMap = useMemo(
    () =>
      ({
        [KEYS.audio]: () => t.blocks.audio,
        [KEYS.blockquote]: () => t.blocks.blockquote,
        [KEYS.callout]: () => t.blocks.callout,
        [KEYS.codeBlock]: () => t.blocks.codeBlock,
        [KEYS.column]: () => t.blocks.column,
        [KEYS.equation]: () => t.blocks.equation,
        [KEYS.file]: () => t.blocks.file,
        [KEYS.h1]: () => t.blocks.heading1,
        [KEYS.h2]: () => t.blocks.heading2,
        [KEYS.h3]: () => t.blocks.heading3,
        [KEYS.h4]: () => t.blocks.heading4,
        [KEYS.h5]: () => t.blocks.heading5,
        [KEYS.h6]: () => t.blocks.heading6,
        [KEYS.hr]: () => t.blocks.horizontalRule,
        [KEYS.img]: () => t.blocks.image,
        [KEYS.mediaEmbed]: () => t.blocks.mediaEmbed,
        [KEYS.p]: (node?: TElement) => {
          if (node?.[KEYS.listType] === KEYS.listTodo) return t.blocks.todoList
          if (node?.[KEYS.listType] === KEYS.ol) return t.blocks.orderedList
          if (node?.[KEYS.listType] === KEYS.ul) return t.blocks.unorderedList

          return 'Paragraph'
        },
        [KEYS.table]: () => t.blocks.table,
        [KEYS.toc]: () => t.blocks.tableOfContents,
        [KEYS.toggle]: () => t.blocks.toggle,
        [KEYS.video]: () => t.blocks.video,
      }) as Record<string, (node?: TElement) => string>,
    [t]
  )

  const resolvedSuggestion = useMemo(() => {
    const map = getOption('uniquePathMap')

    if (suggestionNodes.length === 0) return []

    const suggestionIds = new Set(
      suggestionNodes
        .flatMap(([node]) => {
          if (TextApi.isText(node)) {
            const dataList = api.suggestion.dataList(node)
            const includeUpdate = dataList.some(data => data.type === 'update')

            if (!includeUpdate) return api.suggestion.nodeId(node)

            return dataList.filter(data => data.type === 'update').map(d => d.id)
          }
          if (ElementApi.isElement(node)) {
            return api.suggestion.nodeId(node)
          }
          return null
        })
        .filter(Boolean)
    )

    const res: ResolvedSuggestion[] = []

    for (const id of suggestionIds) {
      if (!id) continue

      const path = map.get(id)

      if (!(path && PathApi.isPath(path))) continue
      if (!PathApi.equals(path, blockPath)) continue

      const entries = [
        ...editor.api.nodes<TElement | TSuggestionText>({
          at: [],
          mode: 'all',
          match: n => (n[KEYS.suggestion] && n[getSuggestionKey(id)]) || api.suggestion.nodeId(n as TElement) === id,
        }),
      ]

      entries.sort(([, path1], [, path2]) => (PathApi.isChild(path1, path2) ? -1 : 1))

      let newText = ''
      let text = ''
      let properties = {}
      let newProperties = {}

      for (const [node] of entries) {
        if (TextApi.isText(node)) {
          const dataList = api.suggestion.dataList(node)

          for (const data of dataList) {
            if (data.id !== id) return

            switch (data.type) {
              case 'insert': {
                newText += node.text

                break
              }
              case 'remove': {
                text += node.text

                break
              }
              case 'update': {
                properties = {
                  ...properties,
                  ...(data.properties as Record<string, string>),
                }

                newProperties = {
                  ...newProperties,
                  ...(data.newProperties as Record<string, string>),
                }

                newText += node.text

                break
              }
            }
          }
        } else {
          const lineBreakData = api.suggestion.isBlockSuggestion(node) ? node.suggestion : undefined

          if (lineBreakData?.id !== keyId2SuggestionId(id)) return

          if (lineBreakData.type === 'insert') {
            newText += lineBreakData.isLineBreak
              ? BLOCK_SUGGESTION
              : BLOCK_SUGGESTION + typeTextMap[node.type as keyof typeof KEYS](node)
          } else if (lineBreakData.type === 'remove') {
            text += lineBreakData.isLineBreak ? BLOCK_SUGGESTION : BLOCK_SUGGESTION + typeTextMap[node.type](node)
          }
        }
      }

      if (entries.length === 0) continue

      const nodeData = api.suggestion.suggestionData(entries[0][0])

      if (!nodeData) continue

      const comments = discussions.find((s: TDiscussion) => s.id === id)?.comments || []
      const createdAt = new Date(nodeData.createdAt)

      const keyId = getSuggestionKey(id)

      if (nodeData.type === 'update') {
        res.push({
          comments,
          createdAt,
          keyId,
          newProperties,
          newText,
          properties,
          suggestionId: keyId2SuggestionId(id),
          type: 'update',
          userId: nodeData.userId,
        })
      }
      if (newText.length > 0 && text.length > 0) {
        res.push({
          comments,
          createdAt,
          keyId,
          newText,
          suggestionId: keyId2SuggestionId(id),
          text,
          type: 'replace',
          userId: nodeData.userId,
        })
      }
      if (newText.length > 0) {
        res.push({
          comments,
          createdAt,
          keyId,
          newText,
          suggestionId: keyId2SuggestionId(id),
          type: 'insert',
          userId: nodeData.userId,
        })
      }
      if (text.length > 0) {
        res.push({
          comments,
          createdAt,
          keyId,
          suggestionId: keyId2SuggestionId(id),
          text,
          type: 'remove',
          userId: nodeData.userId,
        })
      }
    }

    return res
  }, [api, blockPath, discussions, editor, getOption, suggestionNodes, typeTextMap])

  for (const [node] of suggestionNodes) {
    const id = api.suggestion.nodeId(node)
    const map = getOption('uniquePathMap')

    if (!id) continue

    const previousPath = map.get(id)

    if (PathApi.isPath(previousPath)) {
      const nodes = api.suggestion.node({ id, at: previousPath, isText: true })
      const parentNode = api.node(previousPath)
      let lineBreakId: string | null = null

      if (parentNode && ElementApi.isElement(parentNode[0])) {
        lineBreakId = api.suggestion.nodeId(parentNode[0]) ?? null
      }
      if (!nodes && lineBreakId !== id) {
        setOption('uniquePathMap', new Map(map).set(id, blockPath))
        continue
      }
      continue
    }
    setOption('uniquePathMap', new Map(map).set(id, blockPath))
  }

  return resolvedSuggestion as ResolvedSuggestion[]
}

export const isResolvedSuggestion = (suggestion: ResolvedSuggestion | TDiscussion): suggestion is ResolvedSuggestion =>
  'suggestionId' in suggestion
