'use client'

import { Fragment, useMemo, useState } from 'react'

import { getDraftCommentKey } from '@platejs/comment'
import { CommentPlugin } from '@platejs/comment/react'
import { SuggestionPlugin } from '@platejs/suggestion/react'
import { MessageSquareTextIcon, MessagesSquareIcon, PencilLineIcon } from 'lucide-react'
import {
  PathApi,
  TextApi,
  type AnyPluginConfig,
  type NodeEntry,
  type Path,
  type TCommentText,
  type TElement,
  type TSuggestionText,
} from 'platejs'
import {
  useEditorPlugin,
  useEditorRef,
  usePluginOption,
  type PlateElementProps,
  type RenderNodeWrapper,
} from 'platejs/react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { commentPlugin } from '../plugins/comment'
import { discussionPlugin, type TDiscussion } from '../plugins/discussion'
import { suggestionPlugin } from '../plugins/suggestion'
import { BlockSuggestionCard, isResolvedSuggestion, useResolveSuggestion } from './block-suggestion'
import { Comment, CommentCreateForm } from './comment'

export const BlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = props => {
  const { editor, element } = props

  const commentsApi = editor.getApi(CommentPlugin).comment
  const blockPath = editor.api.findPath(element)

  if (!blockPath || blockPath.length > 1) return

  const draftCommentNode = commentsApi.node({ at: blockPath, isDraft: true })

  const commentNodes = [...commentsApi.nodes({ at: blockPath })]

  const suggestionNodes = [...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath })]

  if (commentNodes.length === 0 && suggestionNodes.length === 0 && !draftCommentNode) {
    return
  }

  return props => (
    <BlockCommentContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      draftCommentNode={draftCommentNode}
      suggestionNodes={suggestionNodes}
      {...props}
    />
  )
}

const BlockCommentContent = ({
  blockPath,
  children,
  commentNodes,
  draftCommentNode,
  suggestionNodes,
}: PlateElementProps & {
  blockPath: Path
  commentNodes: NodeEntry<TCommentText>[]
  draftCommentNode: NodeEntry<TCommentText> | undefined
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[]
}) => {
  const editor = useEditorRef()

  const resolvedSuggestions = useResolveSuggestion(suggestionNodes, blockPath)
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath)

  const suggestionsCount = resolvedSuggestions.length
  const discussionsCount = resolvedDiscussions?.length ?? 0
  const totalCount = suggestionsCount + discussionsCount

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId')
  const activeSuggestion = activeSuggestionId && resolvedSuggestions.find(s => s.suggestionId === activeSuggestionId)

  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock')
  const activeCommentId = usePluginOption(commentPlugin, 'activeId')
  const isCommenting = activeCommentId === getDraftCommentKey()
  const activeDiscussion = activeCommentId && resolvedDiscussions?.find(d => d.id === activeCommentId)

  const noneActive = !(activeSuggestion || activeDiscussion)

  const sortedMergedData = [...(resolvedDiscussions ?? []), ...resolvedSuggestions].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

  const selected =
    resolvedDiscussions?.some(d => d.id === activeCommentId) ||
    resolvedSuggestions.some(s => s.suggestionId === activeSuggestionId)

  const [_open, setOpen] = useState(selected)

  const commentingCurrent = !!commentingBlock && PathApi.equals(blockPath, commentingBlock)

  const open = _open || selected || (isCommenting && !!draftCommentNode && commentingCurrent)

  const anchorElement = useMemo(() => {
    let activeNode: NodeEntry | undefined

    if (activeSuggestion) {
      activeNode = suggestionNodes.find(
        ([node]) =>
          TextApi.isText(node) &&
          editor.getApi(SuggestionPlugin).suggestion.nodeId(node) === activeSuggestion.suggestionId
      )
    }

    if (activeCommentId) {
      if (activeCommentId === getDraftCommentKey()) {
        activeNode = draftCommentNode
      } else {
        activeNode = commentNodes.find(
          ([node]) => editor.getApi(commentPlugin).comment.nodeId(node) === activeCommentId
        )
      }
    }

    if (!activeNode) return null

    return editor.api.toDOMNode(activeNode[0])!
  }, [activeSuggestion, activeCommentId, editor.api, suggestionNodes, draftCommentNode, commentNodes, editor.getApi, editor])

  if (suggestionsCount + (resolvedDiscussions?.length ?? 0) === 0 && !draftCommentNode)
    return <div className="w-full">{children}</div>

  return (
    <div className="flex w-full justify-between">
      <Popover
        onOpenChange={_open_ => {
          if (!_open_ && isCommenting && draftCommentNode) {
            editor.tf.unsetNodes(getDraftCommentKey(), {
              at: [],
              mode: 'lowest',
              match: n => n[getDraftCommentKey()],
            })
          }
          setOpen(_open_)
        }}
        open={open}
      >
        <div className="w-full">{children}</div>
        {anchorElement && <PopoverAnchor asChild className="w-full" virtualRef={{ current: anchorElement }} />}

        <PopoverContent
          align="center"
          className={
            'max-h-[min(50dvh,calc(-24px+var(--radix-popper-available-height)))] w-[380px] min-w-[130px] max-w-[calc(100vw-24px)] overflow-y-auto p-0 data-[state=closed]:opacity-0'
          }
          onCloseAutoFocus={e => e.preventDefault()}
          onOpenAutoFocus={e => e.preventDefault()}
          side="bottom"
        >
          {isCommenting ? (
            <CommentCreateForm className="p-4" focusOnMount />
          ) : noneActive ? (
            sortedMergedData.map((item, index) =>
              isResolvedSuggestion(item) ? (
                <BlockSuggestionCard
                  idx={index}
                  isLast={index === sortedMergedData.length - 1}
                  key={item.suggestionId}
                  suggestion={item}
                />
              ) : (
                <BlockComment discussion={item} isLast={index === sortedMergedData.length - 1} key={item.id} />
              )
            )
          ) : (
            <>
              {activeSuggestion && (
                <BlockSuggestionCard
                  idx={0}
                  isLast={true}
                  key={activeSuggestion.suggestionId}
                  suggestion={activeSuggestion}
                />
              )}

              {activeDiscussion && <BlockComment discussion={activeDiscussion} isLast={true} />}
            </>
          )}
        </PopoverContent>

        {totalCount > 0 && (
          <div className="relative left-0 size-0 select-none">
            <PopoverTrigger asChild>
              <Button
                className={
                  'mt-1 ml-1 flex h-6 gap-1 px-1.5! py-0 text-muted-foreground/80 hover:text-muted-foreground/80 data-[active=true]:bg-muted'
                }
                contentEditable={false}
                data-active={open}
                variant="ghost"
              >
                {suggestionsCount > 0 && discussionsCount === 0 && <PencilLineIcon className="size-4 shrink-0" />}

                {suggestionsCount === 0 && discussionsCount > 0 && (
                  <MessageSquareTextIcon className="size-4 shrink-0" />
                )}

                {suggestionsCount > 0 && discussionsCount > 0 && <MessagesSquareIcon className="size-4 shrink-0" />}

                <span className="font-semibold text-xs">{totalCount}</span>
              </Button>
            </PopoverTrigger>
          </div>
        )}
      </Popover>
    </div>
  )
}

const BlockComment = ({ discussion, isLast }: { discussion: TDiscussion; isLast: boolean }) => {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <Fragment key={discussion.id}>
      <div className="p-4">
        {discussion.comments.map((comment, index) => (
          <Comment
            comment={comment}
            discussionLength={discussion.comments.length}
            documentContent={discussion?.documentContent}
            editingId={editingId}
            index={index}
            key={comment.id ?? index}
            setEditingId={setEditingId}
            showDocumentContent
          />
        ))}
        <CommentCreateForm discussionId={discussion.id} />
      </div>

      {!isLast && <div className="h-px w-full bg-muted" />}
    </Fragment>
  )
}

const useResolvedDiscussion = (commentNodes: NodeEntry<TCommentText>[], blockPath: Path) => {
  const { api, getOption, setOption } = useEditorPlugin(commentPlugin)

  const discussions = usePluginOption(discussionPlugin, 'discussions')

  for (const [node] of commentNodes) {
    const id = api.comment.nodeId(node)
    const map = getOption('uniquePathMap')

    if (!id) return

    const previousPath = map.get(id)

    if (PathApi.isPath(previousPath)) {
      const nodes = api.comment.node({ id, at: previousPath })

      if (!nodes) {
        setOption('uniquePathMap', new Map(map).set(id, blockPath))
        return
      }

      return
    }

    setOption('uniquePathMap', new Map(map).set(id, blockPath))
  }

  const commentsIds = new Set(commentNodes.map(([node]) => api.comment.nodeId(node)).filter(Boolean))

  const resolvedDiscussions = discussions
    .map((d: TDiscussion) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }))
    .filter((item: TDiscussion) => {
      const commentsPathMap = getOption('uniquePathMap')
      const firstBlockPath = commentsPathMap.get(item.id)

      if (!firstBlockPath) return false
      if (!PathApi.equals(firstBlockPath, blockPath)) return false

      return api.comment.has({ id: item.id }) && commentsIds.has(item.id) && !item.isResolved
    })

  return resolvedDiscussions
}
